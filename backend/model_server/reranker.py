"""Local Cross-Encoder reranking endpoints for the inference model server."""

import asyncio
import threading
from typing import TYPE_CHECKING

from fastapi import APIRouter
from fastapi import HTTPException

from model_server.utils import simple_log_function_time
from onyx.utils.logger import setup_logger
from shared_configs.configs import INDEXING_ONLY
from shared_configs.model_server_models import RerankRequest
from shared_configs.model_server_models import RerankResponse

if TYPE_CHECKING:
    from sentence_transformers import CrossEncoder


logger = setup_logger()
router = APIRouter(prefix="/encoder")

# Cross-Encoders are expensive to load. Keep one instance per model name so a
# tenant/model switch does not reload the model for every search request.
_RERANK_MODELS: dict[str, "CrossEncoder"] = {}
_RERANK_MODELS_LOCK = threading.Lock()


def get_reranking_model(model_name: str) -> "CrossEncoder":
    """Load a local Cross-Encoder once and reuse it for subsequent requests."""
    from sentence_transformers import CrossEncoder

    with _RERANK_MODELS_LOCK:
        model = _RERANK_MODELS.get(model_name)
        if model is None:
            logger.notice(f"Loading local Cross-Encoder {model_name}")
            model = CrossEncoder(model_name)
            _RERANK_MODELS[model_name] = model
    return model


@simple_log_function_time()
async def local_rerank(
    query: str, documents: list[str], model_name: str
) -> list[float]:
    model = get_reranking_model(model_name)
    pairs = [(query, document) for document in documents]
    scores = await asyncio.to_thread(model.predict, pairs)
    # numpy tensors and Python lists are both returned by supported versions of
    # sentence-transformers; normalize either form to the API contract.
    return [float(score) for score in scores]


@router.post("/cross-encoder-scores", response_model=RerankResponse)
async def process_rerank_request(rerank_request: RerankRequest) -> RerankResponse:
    """Score query/document pairs with a local Cross-Encoder."""
    if rerank_request.provider_type is not None:
        raise HTTPException(
            status_code=400,
            detail="Cloud rerank providers must be called directly by the backend.",
        )
    if INDEXING_ONLY:
        raise HTTPException(
            status_code=503,
            detail="The indexing-only model server cannot serve reranking requests.",
        )
    if not rerank_request.query or not rerank_request.documents:
        raise HTTPException(status_code=400, detail="Missing query or documents")
    if not all(rerank_request.documents):
        raise HTTPException(status_code=400, detail="Empty documents are not allowed")
    if not rerank_request.model_name.strip():
        raise HTTPException(status_code=400, detail="A model name is required")

    try:
        scores = await local_rerank(
            query=rerank_request.query,
            documents=rerank_request.documents,
            model_name=rerank_request.model_name,
        )
        return RerankResponse(scores=scores)
    except Exception as exc:
        logger.exception("Error during Cross-Encoder reranking")
        raise HTTPException(
            status_code=500, detail=f"Failed to run Cross-Encoder reranking: {exc}"
        ) from exc

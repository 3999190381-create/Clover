"use client";

import { ThreeDotsLoader } from "@/components/Loading";
import { AdminPageTitle } from "@/components/admin/Title";
import { errorHandlingFetcher } from "@/lib/fetcher";
import Text from "@/components/ui/text";
import Title from "@/components/ui/title";
import Button from "@/refresh-components/buttons/Button";
import useSWR from "swr";
import { ModelPreview } from "@/components/embedding/ModelSelector";
import {
  HostedEmbeddingModel,
  CloudEmbeddingModel,
} from "@/components/embedding/interfaces";
import { SavedSearchSettings } from "@/app/admin/embeddings/interfaces";
import UpgradingPage from "./UpgradingPage";
import { useContext } from "react";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import CardSection from "@/components/admin/CardSection";
import { ErrorCallout } from "@/components/ErrorCallout";
import { usePopupFromQuery } from "@/components/popup/PopupFromQuery";
import { SvgSearch } from "@opal/icons";
import { useLanguage } from "@/hooks/useLanguage";
export interface EmbeddingDetails {
  api_key: string;
  custom_config: any;
  default_model_id?: number;
  name: string;
}

function Main() {
  const isChinese = useLanguage().language === "zh";
  const settings = useContext(SettingsContext);
  const { popup: searchSettingsPopup } = usePopupFromQuery({
    "search-settings": {
      message: `Changed search settings successfully`,
      type: "success",
    },
  });
  const {
    data: currentEmeddingModel,
    isLoading: isLoadingCurrentModel,
    error: currentEmeddingModelError,
  } = useSWR<CloudEmbeddingModel | HostedEmbeddingModel | null>(
    "/api/search-settings/get-current-search-settings",
    errorHandlingFetcher,
    { refreshInterval: 5000 } // 5 seconds
  );

  const { data: searchSettings, isLoading: isLoadingSearchSettings } =
    useSWR<SavedSearchSettings | null>(
      "/api/search-settings/get-current-search-settings",
      errorHandlingFetcher,
      { refreshInterval: 5000 } // 5 seconds
    );

  const {
    data: futureEmbeddingModel,
    isLoading: isLoadingFutureModel,
    error: futureEmeddingModelError,
  } = useSWR<CloudEmbeddingModel | HostedEmbeddingModel | null>(
    "/api/search-settings/get-secondary-search-settings",
    errorHandlingFetcher,
    { refreshInterval: 5000 } // 5 seconds
  );

  if (
    isLoadingCurrentModel ||
    isLoadingFutureModel ||
    isLoadingSearchSettings
  ) {
    return <ThreeDotsLoader />;
  }

  if (
    currentEmeddingModelError ||
    !currentEmeddingModel ||
    futureEmeddingModelError
  ) {
    return <ErrorCallout errorTitle={isChinese ? "获取嵌入模型状态失败" : "Failed to fetch embedding model status"} />;
  }

  return (
    <div>
      {searchSettingsPopup}
      {!futureEmbeddingModel ? (
        <>
          {settings?.settings.needs_reindexing && (
            <p className="max-w-3xl">
              {isChinese ? "当前搜索设置已过期，建议更新搜索设置并重新建立索引。" : "Your search settings are currently out of date! We recommend updating your search settings and re-indexing."}
            </p>
          )}
          <Title className="mb-6 mt-8 !text-2xl">{isChinese ? "嵌入模型" : "Embedding Model"}</Title>

          {currentEmeddingModel ? (
            <ModelPreview model={currentEmeddingModel} display showDetails />
          ) : (
            <Title className="mt-8 mb-4">{isChinese ? "选择嵌入模型" : "Choose your Embedding Model"}</Title>
          )}

          <Title className="mb-2 mt-8 !text-2xl">{isChinese ? "后处理" : "Post-processing"}</Title>

          <CardSection className="!mr-auto mt-8 !w-96 shadow-lg bg-background-tint-00 rounded-16">
            {searchSettings && (
              <>
                <div className="px-1 w-full rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <Text className="font-semibold">{isChinese ? "重排模型" : "Reranking Model"}</Text>
                      <Text className="text-text-700">
                        {searchSettings.rerank_model_name || (isChinese ? "未设置" : "Not set")}
                      </Text>
                    </div>

                    <div>
                      <Text className="font-semibold">{isChinese ? "重排结果数" : "Results to Rerank"}</Text>
                      <Text className="text-text-700">
                        {searchSettings.num_rerank}
                      </Text>
                    </div>

                    <div>
                      <Text className="font-semibold">
                        {isChinese ? "多语言扩展" : "Multilingual Expansion"}
                      </Text>
                      <Text className="text-text-700">
                        {searchSettings.multilingual_expansion.length > 0
                          ? searchSettings.multilingual_expansion.join(", ")
                          : isChinese ? "无" : "None"}
                      </Text>
                    </div>

                    <div>
                      <Text className="font-semibold">{isChinese ? "多轮索引" : "Multipass Indexing"}</Text>
                      <Text className="text-text-700">
                        {searchSettings.multipass_indexing
                          ? isChinese ? "已启用" : "Enabled"
                          : isChinese ? "已停用" : "Disabled"}
                      </Text>
                    </div>

                    <div>
                      <Text className="font-semibold">{isChinese ? "上下文 RAG" : "Contextual RAG"}</Text>
                      <Text className="text-text-700">
                        {searchSettings.enable_contextual_rag
                          ? isChinese ? "已启用" : "Enabled"
                          : isChinese ? "已停用" : "Disabled"}
                      </Text>
                    </div>

                    <div>
                      <Text className="font-semibold">
                        {isChinese ? "流式输出时禁用重排" : "Disable Reranking for Streaming"}
                      </Text>
                      <Text className="text-text-700">
                        {searchSettings.disable_rerank_for_streaming
                          ? "Yes"
                          : "No"}
                      </Text>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardSection>

          <div className="mt-4">
            <Button action href="/admin/embeddings">
              {isChinese ? "更新搜索设置" : "Update Search Settings"}
            </Button>
          </div>
        </>
      ) : (
        <UpgradingPage futureEmbeddingModel={futureEmbeddingModel} />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <AdminPageTitle title="Search Settings" icon={SvgSearch} />
      <Main />
    </>
  );
}

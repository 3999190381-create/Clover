# Clover RAG 质量小测试

## 公开数据集起步方案

如果暂时没有课程、课件和考勤资料，可以先使用公开中文检索集建立可复现基线：

- **CMTEB T2Retrieval**：优先推荐，适合中文 query-document 检索和 Top-K 召回对比。
- **CMTEB MMarco**：适合补充 query-document 相关性评测。
- **DuReader / CMRC2018**：适合补充回答正确性和段落定位评测，但不要与检索召回指标混用。

公开数据集通常使用 corpus/document id，而本评测脚本通过 `Document.link` 匹配相关文档。导入公开语料时，请为每个文档生成稳定链接，例如：

```text
https://public-eval.local/{dataset}/{split}/{doc_id}
```

然后将 query、相关文档链接和参考答案转换为本目录的 `test_queries.json` 格式。优化前后必须使用同一 corpus、同一 query split 和同一 Top-K；公开集结果只能作为离线基准，不能直接等同于课程资料场景的线上效果。

这个脚本会调用 Clover 的真实检索与非流式问答接口，并对每条问题输出检索质量、回答质量和耗时。适合先用 5～10 条人工标注问题做冒烟测试，再逐步扩充测试集。

完整评测会为每个问题创建临时聊天会话；脚本在取得回答后会尽力自动删除，避免污染正常聊天记录。

## 指标

所有质量指标均为 0～1，越高越好；Top-K accuracy 使用 0～100%。

| 指标 | 含义 | 是否需要参考答案 |
| --- | --- | --- |
| `context_precision` | 检索结果中，标注为相关的文档所占比例 | 否，需要标注相关文档链接 |
| `context_recall` | 标注的相关文档中，被成功召回的比例 | 否，需要标注相关文档链接 |
| `context_f1` | Precision 与 Recall 的调和平均 | 否 |
| `answer_relevancy` | 回答是否切题 | 否，使用 Ragas + LLM judge |
| `faithfulness` | 回答中的陈述是否能由实际检索上下文支持 | 否，使用 Ragas + LLM judge |
| `answer_correctness` | 回答与人工参考答案在事实及语义上是否一致 | 是，使用 Ragas + LLM judge |

检索指标按“文档 ID”计算，同一文档命中多个 chunk 只计一次：

```text
precision = 命中的相关文档数 / 返回的去重文档数
recall    = 命中的相关文档数 / 标注的相关文档数
F1        = 2 * precision * recall / (precision + recall)
```

## 准备

1. 启动 Clover，并确认 `http://127.0.0.1:8080/health` 可访问。
2. 确保测试涉及的文档已经完成索引。
3. 复制 `test_queries.json.template` 为 `test_queries.json`，建议先写 5～10 条。
4. 如果 `.vscode/.env` 不存在，先复制 `.vscode/env_template.txt`，然后配置：
   - `AUTH_TYPE=disabled`：本机无鉴权测试；如果启用了鉴权，则配置 `ONYX_API_KEY`。
   - `OPENAI_API_KEY`：完整回答评测的 judge 模型需要；只测检索时不需要。

```powershell
Copy-Item .vscode/env_template.txt .vscode/.env
Copy-Item backend/tests/regression/search_quality/test_queries.json.template `
  backend/tests/regression/search_quality/test_queries.json
```

每条数据包含：

- `question`：测试问题。
- `ground_truth`：应该召回的文档列表。`doc_link` 必须能在当前索引的 `Document.link` 中匹配到。
- `ground_truth_response`：人工参考答案。缺少该字段时，`answer_correctness` 留空，其余指标仍可计算。
- `categories`：用于分类汇总，例如 `easy`、`policy`、`multi-hop`。

不要把模型生成的答案直接当作参考答案；参考答案应短、事实完整，并由标注文档支持。

## 运行一个小测试

从 Clover 仓库根目录执行。`--with` 会为本次命令临时提供与现有评测 API 匹配的 Ragas 版本，不需要改项目依赖：

```powershell
uv run --package onyx-backend --with "ragas==0.3.9" python backend/tests/regression/search_quality/run_search_eval.py `
  --dataset backend/tests/regression/search_quality/test_queries.json `
  --num_search 5 `
  --num_answer 5 `
  --max_workers 1 `
  --api_endpoint http://127.0.0.1:8080
```

只测检索（不调用回答模型和 judge）：

```powershell
uv run --package onyx-backend --with "ragas==0.3.9" python backend/tests/regression/search_quality/run_search_eval.py `
  --dataset backend/tests/regression/search_quality/test_queries.json `
  --num_search 5 `
  --max_workers 1 `
  --search_only
```

常用参数：

```text
-d, --dataset          测试集 JSON 路径
-n, --num_search       每次检索最多返回的文档数，默认 50
-a, --num_answer       回答评测最多使用的上下文数，默认 25
-w, --max_workers      并发数；小测试建议 1
-r, --max_req_rate     每分钟最多请求数，0 表示不限速
-q, --timeout          单次请求超时秒数，默认 120
-e, --api_endpoint     Clover API 地址，默认 http://127.0.0.1:8080
-s, --search_only      只运行检索评测
-t, --tenant_id        多租户模式下使用的租户 ID
```

## 结果

每次运行会创建 `eval-YYYY-MM-DD-HH-MM-SS` 目录：

- `test_queries.json`：解析并匹配到文档 ID 后的实际测试集。
- `search_results.json`：逐问题的答案、检索文档、回答实际使用的上下文和各项分数。
- `results_by_category.csv`：总体及分类平均分，可直接用 Excel 打开。
- `search_position_chart.png`：相关文档在结果中的排名分布。

Ragas 指标由 LLM 判断，存在少量随机波动。比较两个版本时应固定测试集、检索数量、judge 模型和并发配置，并至少重复运行 3 次取平均值。

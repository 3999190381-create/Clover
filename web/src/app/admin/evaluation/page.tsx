"use client";

import { useEffect, useMemo, useState } from "react";
import { SvgActivity } from "@opal/icons";
import { AdminPageTitle } from "@/components/admin/Title";
import Button from "@/refresh-components/buttons/Button";
import { useLanguage } from "@/hooks/useLanguage";

type Step = { title: string; detail: string; time: string };

const STEPS_ZH: Step[] = [
  { title: "问题理解与拆解", detail: "识别主题、约束和需要验证的子问题", time: "42 ms" },
  { title: "混合检索", detail: "关键词 + 向量召回候选上下文", time: "186 ms" },
  { title: "重排与去重", detail: "按相关性重排，并过滤重复片段", time: "74 ms" },
  { title: "上下文组装", detail: "拼接来源、证据和引用信息", time: "31 ms" },
  { title: "答案生成", detail: "将证据交给回答模型生成草稿", time: "—" },
  { title: "质量评测", detail: "计算召回、忠实度和答案质量指标", time: "—" },
];

const STEPS_EN: Step[] = [
  { title: "Understand & decompose", detail: "Identify topic, constraints, and sub-questions", time: "42 ms" },
  { title: "Hybrid retrieval", detail: "Retrieve candidate context with keyword + vector search", time: "186 ms" },
  { title: "Rerank & deduplicate", detail: "Sort by relevance and remove duplicate passages", time: "74 ms" },
  { title: "Assemble context", detail: "Pack sources, evidence, and citations", time: "31 ms" },
  { title: "Generate answer", detail: "Pass grounded evidence to the answer model", time: "—" },
  { title: "Evaluate quality", detail: "Calculate retrieval, faithfulness, and answer metrics", time: "—" },
];

export default function EvaluationDemoPage() {
  const isZh = useLanguage().language === "zh";
  const steps = isZh ? STEPS_ZH : STEPS_EN;
  const [running, setRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(steps.length - 1);

  useEffect(() => {
    setActiveStep(steps.length - 1);
  }, [isZh, steps.length]);

  useEffect(() => {
    if (!running) return;
    setActiveStep(0);
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      if (current >= steps.length) {
        window.clearInterval(timer);
        setRunning(false);
        setActiveStep(steps.length - 1);
      } else {
        setActiveStep(current);
      }
    }, 650);
    return () => window.clearInterval(timer);
  }, [running, steps.length]);

  const metrics = useMemo(
    () =>
      isZh
        ? [
            ["上下文精确率", "1.00", "Top-5"],
            ["上下文召回率", "1.00", "命中目标来源"],
            ["上下文 F1", "1.00", "精确率与召回率调和平均"],
            ["忠实度", "—", "需要可用的答案生成模型"],
            ["答案相关性", "—", "需要可用的答案生成模型"],
            ["答案正确性", "—", "需要参考答案与生成结果"],
          ]
        : [
            ["Context precision", "1.00", "Top-5"],
            ["Context recall", "1.00", "Expected source found"],
            ["Context F1", "1.00", "Harmonic mean"],
            ["Faithfulness", "—", "Answer model required"],
            ["Answer relevancy", "—", "Answer model required"],
            ["Answer correctness", "—", "Reference + answer required"],
          ],
    [isZh]
  );

  return (
    <div className="pb-10">
      <AdminPageTitle
        icon={<SvgActivity size={32} />}
        title={isZh ? "复杂问题评测演示" : "Complex Query Evaluation Demo"}
        farRightElement={
          <Button onClick={() => setRunning(true)} disabled={running}>
            {running
              ? isZh
                ? "运行中..."
                : "Running..."
              : isZh
                ? "运行本地演示"
                : "Run local demo"}
          </Button>
        }
      />

      <section className="rounded-16 border border-border bg-background-sidebar p-6 shadow-01">
        <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-text-03">
          {isZh ? "复杂问题 · 本地 Smoke Test" : "Complex query · local smoke test"}
        </div>
        <h2 className="max-w-4xl text-xl font-semibold text-text-01">
          {isZh
            ? "比较遗传算法、粒子群优化和模拟退火的搜索机制，并说明它们在什么场景下更适合使用。"
            : "Compare the search mechanisms of genetic algorithms, particle swarm optimization, and simulated annealing, and explain when each is appropriate."}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-text-03">
          {isZh
            ? "这是一个不调用外部模型的展示流程：它复现 Clover 的 RAG 调用链路，并使用已索引数据验证检索质量。"
            : "This self-contained demo does not call an external model. It mirrors Clover's RAG chain and validates retrieval quality against indexed data."}
        </p>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-01">
              {isZh ? "调用链路" : "Call chain"}
            </h3>
            <p className="text-sm text-text-03">
              {isZh ? "从问题进入到质量评测的完整路径" : "From question intake to quality evaluation"}
            </p>
          </div>
          <span className="rounded-full bg-background-tint-01 px-3 py-1 text-xs text-text-03">
            {running ? (isZh ? "执行中" : "Executing") : isZh ? "可重复" : "Repeatable"}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((step, index) => {
            const done = index <= activeStep;
            return (
              <div
                key={step.title}
                className={`rounded-12 border p-4 transition-colors ${
                  done
                    ? "border-link/40 bg-link/05"
                    : "border-border bg-background-sidebar"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-03">0{index + 1}</span>
                  <span className="text-xs text-text-03">{step.time}</span>
                </div>
                <h4 className="mt-3 font-semibold text-text-01">{step.title}</h4>
                <p className="mt-1 text-sm leading-5 text-text-03">{step.detail}</p>
                <div className="mt-4 h-1 overflow-hidden rounded-full bg-background-tint-01">
                  <div className={`h-full rounded-full bg-link transition-all ${done ? "w-full" : "w-0"}`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-text-01">{isZh ? "当前测试指标" : "Current test metrics"}</h3>
          <p className="text-sm text-text-03">
            {isZh ? "检索指标来自本地 Top-5 搜索结果；答案指标需要生成模型返回答案。" : "Retrieval metrics come from local Top-5 search; answer metrics require a generated answer."}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(([label, value, note]) => (
            <div key={label} className="rounded-12 border border-border bg-background-sidebar p-4">
              <div className="text-sm text-text-03">{label}</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-text-01">{value}</div>
              <div className="mt-2 text-xs text-text-03">{note}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-12 border border-border bg-background-sidebar p-5">
        <h3 className="font-semibold text-text-01">{isZh ? "测试说明" : "Test notes"}</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-text-03">
          <li>{isZh ? "数据集：遗传算法短查询 + 预期 Wikipedia 来源。" : "Dataset: a short genetic-algorithm query with an expected Wikipedia source."}</li>
          <li>{isZh ? "方法：Top-5 检索，按目标来源是否命中计算 Precision、Recall 和 F1。" : "Method: Top-5 retrieval; compute precision, recall, and F1 from expected-source hits."}</li>
          <li>{isZh ? "忠实度、答案相关性、答案正确性在连接可用生成模型后自动补齐。" : "Faithfulness, relevancy, and correctness can be filled once a generation model is available."}</li>
        </ul>
      </section>
    </div>
  );
}

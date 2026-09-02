"use client";

import { errorHandlingFetcher } from "@/lib/fetcher";
import useSWR from "swr";
import { Callout } from "@/components/ui/callout";
import Text from "@/refresh-components/texts/Text";
import Title from "@/components/ui/title";
import { ThreeDotsLoader } from "@/components/Loading";
import { LLMProviderView } from "./interfaces";
import { LLM_PROVIDERS_ADMIN_URL } from "./constants";
import { OpenAIForm } from "./forms/OpenAIForm";
import { AnthropicForm } from "./forms/AnthropicForm";
import { OllamaForm } from "./forms/OllamaForm";
import { AzureForm } from "./forms/AzureForm";
import { BedrockForm } from "./forms/BedrockForm";
import { VertexAIForm } from "./forms/VertexAIForm";
import { OpenRouterForm } from "./forms/OpenRouterForm";
import { getFormForExistingProvider } from "./forms/getForm";
import { CustomForm } from "./forms/CustomForm";
import { useLanguage } from "@/hooks/useLanguage";

export function LLMConfiguration() {
  const isChinese = useLanguage().language === "zh";
  const { data: existingLlmProviders } = useSWR<LLMProviderView[]>(
    LLM_PROVIDERS_ADMIN_URL,
    errorHandlingFetcher
  );

  if (!existingLlmProviders) {
    return <ThreeDotsLoader />;
  }

  const isFirstProvider = existingLlmProviders.length === 0;

  return (
    <>
      <Title className="mb-2">{isChinese ? "已启用的大语言模型提供商" : "Enabled LLM Providers"}</Title>

      {existingLlmProviders.length > 0 ? (
        <>
          <Text as="p" className="mb-4">
            {isChinese
              ? "如果启用了多个大语言模型提供商，默认提供商将用于所有“默认”助手。对于用户创建的助手，可以选择最适合使用场景的提供商或模型。"
              : 'If multiple LLM providers are enabled, the default provider will be used for all "Default" Assistants. For user-created Assistants, you can select the LLM provider/model that best fits the use case!'}
          </Text>
          <div className="flex flex-col gap-y-4">
            {[...existingLlmProviders]
              .sort((a, b) => {
                if (a.is_default_provider && !b.is_default_provider) return -1;
                if (!a.is_default_provider && b.is_default_provider) return 1;
                return 0;
              })
              .map((llmProvider) => (
                <div key={llmProvider.id}>
                  {getFormForExistingProvider(llmProvider)}
                </div>
              ))}
          </div>
        </>
      ) : (
        <Callout type="warning" title={isChinese ? "尚未配置大语言模型提供商" : "No LLM providers configured yet"}>
          {isChinese ? "请在下方配置一个提供商后开始使用 Clover。" : "Please set one up below in order to start using Clover!"}
        </Callout>
      )}

      <Title className="mb-2 mt-6">{isChinese ? "添加大语言模型提供商" : "Add LLM Provider"}</Title>
      <Text as="p" className="mb-4">
        {isChinese
          ? "可从默认提供商中选择，或指定自定义的大语言模型提供商。"
          : "Add a new LLM provider by either selecting from one of the default providers or by specifying your own custom LLM provider."}
      </Text>

      <div className="flex flex-col gap-y-4">
        <OpenAIForm shouldMarkAsDefault={isFirstProvider} />
        <AnthropicForm shouldMarkAsDefault={isFirstProvider} />
        <OllamaForm shouldMarkAsDefault={isFirstProvider} />
        <AzureForm shouldMarkAsDefault={isFirstProvider} />
        <BedrockForm shouldMarkAsDefault={isFirstProvider} />
        <VertexAIForm shouldMarkAsDefault={isFirstProvider} />
        <OpenRouterForm shouldMarkAsDefault={isFirstProvider} />

        <CustomForm shouldMarkAsDefault={isFirstProvider} />
      </div>
    </>
  );
}

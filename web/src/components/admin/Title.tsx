"use client";

import { JSX } from "react";
import { HealthCheckBanner } from "../health/healthcheck";
import Separator from "@/refresh-components/Separator";
import type { IconProps } from "@opal/types";
import Text from "@/refresh-components/texts/Text";
import { useLanguage } from "@/hooks/useLanguage";

const ADMIN_TITLE_ZH: Record<string, string> = {
  "Existing Connectors": "已有连接器",
  "Add Connector": "添加连接器",
  "Document Sets": "文档集",
  "Document Explorer": "文档浏览器",
  "Document Feedback": "文档反馈",
  "Manage Users": "用户管理",
  "Manage User Groups": "用户组管理",
  Assistants: "助手",
  "API Keys": "API 密钥",
  "Token Rate Limits": "令牌速率限制",
  "Default Assistant": "默认助手",
  LLM: "大语言模型",
  "Web Search": "网页搜索",
  "Image Generation": "图像生成",
  "Search Settings": "搜索设置",
  "Document Processing": "文档处理",
  "Knowledge Graph": "知识图谱",
  "Usage Statistics": "使用统计",
  "Query History": "查询历史",
  "Custom Analytics": "自定义分析",
  Settings: "设置",
  "Workspace Settings": "工作区设置",
  "Debug Logs": "调试日志",
};

export interface AdminPageTitleProps {
  icon: React.FunctionComponent<IconProps> | React.ReactNode;
  title: string | JSX.Element;
  farRightElement?: JSX.Element;
  includeDivider?: boolean;
}

export function AdminPageTitle({
  icon: Icon,
  title,
  farRightElement,
  includeDivider = true,
}: AdminPageTitleProps) {
  const isChinese = useLanguage().language === "zh";
  const displayTitle =
    isChinese && typeof title === "string" ? ADMIN_TITLE_ZH[title] || title : title;

  return (
    <div className="w-full">
      <div className="mb-4">
        <HealthCheckBanner />
      </div>
      <div className="w-full flex flex-row justify-between">
        <div className="flex flex-row gap-2">
          {typeof Icon === "function" ? (
            <Icon className="stroke-text-04 h-8 w-8" />
          ) : (
            Icon
          )}
          <Text headingH2 aria-label="admin-page-title">
            {displayTitle}
          </Text>
        </div>
        {farRightElement}
      </div>
      {includeDivider ? <Separator /> : <div className="mb-6" />}
    </div>
  );
}

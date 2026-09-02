import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

const TITLE_ZH: Record<string, string> = {
  "Enabled LLM Providers": "已启用的大语言模型提供商",
  "Add LLM Provider": "添加大语言模型提供商",
  "Global Token Rate Limits": "全局令牌速率限制",
  "User Token Rate Limits": "用户令牌速率限制",
  "User Group Token Rate Limits": "用户组令牌速率限制",
  "Existing API Keys": "已有 API 密钥",
  "Current Users": "当前用户",
  "Invited Users": "已邀请用户",
  "Embedding Model": "嵌入模型",
  "Post-processing": "后处理",
  "Image Generation Model": "图像生成模型",
  "Server Configurations": "服务器配置",
};

export default function Title({
  children,
  className,
  size = "sm",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "lg" | "md" | "sm";
}) {
  const isChinese = useLanguage().language === "zh";
  const displayChildren =
    isChinese && typeof children === "string"
      ? TITLE_ZH[children] || children
      : children;
  return (
    <h1
      className={cn(
        "text-lg text-neutral-800 dark:text-neutral-200 font-medium",
        size === "lg" && "text-2xl",
        size === "md" && "text-xl",
        size === "sm" && "text-lg",
        className
      )}
    >
      {displayChildren}
    </h1>
  );
}

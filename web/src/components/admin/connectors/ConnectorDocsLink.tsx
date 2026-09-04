import { ValidSources } from "@/lib/types";
import { getSourceDocLink } from "@/lib/sources";
import { useLanguage } from "@/hooks/useLanguage";

export default function ConnectorDocsLink({
  sourceType,
  className,
}: {
  sourceType: ValidSources;
  className?: string;
}) {
  const docsLink = getSourceDocLink(sourceType);
  const { language } = useLanguage();

  if (!docsLink) {
    return null;
  }

  const paragraphClass = ["text-sm", className].filter(Boolean).join(" ");

  return (
    <p className={paragraphClass}>
      {language === "zh" ? "配置说明请参阅" : "Check out"}
      <a
        className="text-blue-600 hover:underline"
        target="_blank"
        rel="noopener"
        href={docsLink}
      >
        {" "}
        {language === "zh" ? "文档" : "our docs"}{" "}
      </a>
      {language === "zh"
        ? "，了解如何配置此连接器。"
        : "for more info on configuring this connector."}
    </p>
  );
}

/**
 * Lightweight translations for the connector setup flow.
 *
 * Connector definitions are shared with the API and intentionally keep their
 * canonical English labels. This helper localizes high-frequency labels at
 * render time without changing connector payload keys or validation.
 */
const ZH: Record<string, string> = {
  "Admin Page": "管理后台",
  "Curator Page": "内容管理页",
  Credential: "凭据",
  Connector: "连接器",
  "Advanced (optional)": "高级设置（可选）",
  "Connector Name": "连接器名称",
  Github: "GitHub",
  "A descriptive name for the connector.": "用于识别此连接器的描述性名称。",
  "Repository Owner": "仓库所有者",
  "What should we index from GitHub?": "要从 GitHub 索引哪些内容？",
  "Specific Repository": "指定仓库",
  Everything: "全部仓库",
  "Repository Name(s)": "仓库名称",
  "For multiple repositories, enter comma-separated names (e.g., repo1,repo2,repo3)":
    "如需添加多个仓库，请用英文逗号分隔（例如：repo1,repo2,repo3）。",
  "Include pull requests?": "包含 Pull Request？",
  "Index pull requests from repositories": "索引仓库中的 Pull Request",
  "Include Issues?": "包含 Issues？",
  "Index issues from repositories": "索引仓库中的 Issue",
  Previous: "上一步",
  Continue: "继续",
  Advanced: "高级设置",
  "Create Connector": "创建连接器",
  "Create New": "新建",
  "Select a credential": "选择凭据",
  "Select a credential as needed! Ensure that you have selected a credential with the proper permissions for this connector!":
    "请选择凭据，并确认该凭据拥有此连接器所需的权限。",
  "GitHub credential appears to be invalid or expired (HTTP 401).":
    "GitHub 凭据无效或已过期（HTTP 401）。请重新创建访问令牌，并确认令牌仍可访问目标仓库。",
  "Your GitHub token does not have sufficient permissions for this repository (HTTP 403).":
    "GitHub 令牌没有访问此仓库的足够权限（HTTP 403）。请检查仓库权限和令牌授权范围。",
};

export function connectorText(
  text: string | undefined | null,
  language: "en" | "zh"
): string | undefined {
  if (text == null) return undefined;
  if (language !== "zh") return text;
  return ZH[text] ?? text;
}

export function connectorErrorText(
  message: string | undefined | null,
  language: "en" | "zh"
): string | undefined {
  if (message == null) return undefined;
  if (language !== "zh") return message;
  const normalized = message.replace(/^Error:\s*/i, "");
  const translated = ZH[normalized];
  if (translated) return "错误：" + translated;

  const validationPrefix = "Connector validation error:";
  if (normalized.startsWith(validationPrefix)) {
    const detail = normalized.slice(validationPrefix.length).trim();
    const detailZh = ZH[detail] ?? detail;
    return "连接器校验错误：" + detailZh;
  }

  return message;
}

"use client";

import { usePathname } from "next/navigation";
import { useSettingsContext } from "@/components/settings/SettingsProvider";
import { CgArrowsExpandUpLeft } from "react-icons/cg";
import Text from "@/refresh-components/texts/Text";
import SidebarSection from "@/sections/sidebar/SidebarSection";
import SidebarWrapper from "@/sections/sidebar/SidebarWrapper";
import { useIsKGExposed } from "@/app/admin/kg/utils";
import { useCustomAnalyticsEnabled } from "@/lib/hooks/useCustomAnalyticsEnabled";
import { useUser } from "@/components/user/UserProvider";
import { UserRole } from "@/lib/types";
import { MdOutlineCreditCard } from "react-icons/md";
import {
  ClipboardIcon,
  NotebookIconSkeleton,
  SlackIconSkeleton,
  BrainIcon,
} from "@/components/icons/icons";
import { CombinedSettings } from "@/app/admin/settings/interfaces";
import SidebarTab from "@/refresh-components/buttons/SidebarTab";
import SidebarBody from "@/sections/sidebar/SidebarBody";
import {
  SvgActions,
  SvgActivity,
  SvgBarChart,
  SvgCpu,
  SvgFileText,
  SvgFolder,
  SvgGlobe,
  SvgImage,
  SvgKey,
  SvgOnyxLogo,
  SvgOnyxOctagon,
  SvgSearch,
  SvgServer,
  SvgSettings,
  SvgShield,
  SvgThumbsUp,
  SvgUploadCloud,
  SvgUser,
  SvgUsers,
  SvgZoomIn,
  SvgPaintBrush,
  SvgDiscordMono,
} from "@opal/icons";
import SvgMcp from "@opal/icons/mcp";
import UserAvatarPopover from "@/sections/sidebar/UserAvatarPopover";
import { useLanguage } from "@/hooks/useLanguage";

const ADMIN_LABELS_ZH: Record<string, string> = {
  "Existing Connectors": "已有连接器",
  "Add Connector": "添加连接器",
  "Document Sets": "文档集",
  Explorer: "文档浏览器",
  Feedback: "反馈",
  Connectors: "连接器",
  "Document Management": "文档管理",
  "Custom Assistants": "自定义助手",
  Assistants: "助手",
  "Slack Bots": "Slack 机器人",
  "Discord Bots": "Discord 机器人",
  "MCP Actions": "MCP 操作",
  "OpenAPI Actions": "OpenAPI 操作",
  "Standard Answers": "标准答案",
  "User Management": "用户管理",
  Groups: "用户组",
  Configuration: "配置",
  "Default Assistant": "默认助手",
  LLM: "大语言模型",
  "Web Search": "网页搜索",
  "Image Generation": "图像生成",
  "Search Settings": "搜索设置",
  "Document Processing": "文档处理",
  "Knowledge Graph": "知识图谱",
  Users: "用户",
  "API Keys": "API 密钥",
  "Token Rate Limits": "令牌速率限制",
  Performance: "性能",
  "Usage Statistics": "使用统计",
  "Query History": "查询历史",
  "Custom Analytics": "自定义分析",
  Settings: "设置",
  "Workspace Settings": "工作区设置",
  "Appearance & Theming": "外观与主题",
  Billing: "账单",
};

function adminLabel(label: string, isChinese: boolean) {
  return isChinese ? ADMIN_LABELS_ZH[label] || label : label;
}

const connectors_items = () => [
  {
    name: "Existing Connectors",
    icon: NotebookIconSkeleton,
    link: "/admin/indexing/status",
  },
  {
    name: "Add Connector",
    icon: SvgUploadCloud,
    link: "/admin/add-connector",
  },
];

const document_management_items = () => [
  {
    name: "Document Sets",
    icon: SvgFolder,
    link: "/admin/documents/sets",
  },
  {
    name: "Explorer",
    icon: SvgZoomIn,
    link: "/admin/documents/explorer",
  },
  {
    name: "Feedback",
    icon: SvgThumbsUp,
    link: "/admin/documents/feedback",
  },
];

const custom_assistants_items = (
  isCurator: boolean,
  enableEnterprise: boolean
) => {
  const items = [
    {
      name: "Assistants",
      icon: SvgOnyxOctagon,
      link: "/admin/assistants",
    },
  ];

  if (!isCurator) {
    items.push(
      {
        name: "Slack Bots",
        icon: SlackIconSkeleton,
        link: "/admin/bots",
      },
      {
        name: "Discord Bots",
        icon: SvgDiscordMono,
        link: "/admin/discord-bot",
      }
    );
  }

  items.push(
    {
      name: "MCP Actions",
      icon: SvgMcp,
      link: "/admin/actions/mcp",
    },
    {
      name: "OpenAPI Actions",
      icon: SvgActions,
      link: "/admin/actions/open-api",
    }
  );

  if (enableEnterprise) {
    items.push({
      name: "Standard Answers",
      icon: ClipboardIcon,
      link: "/admin/standard-answer",
    });
  }

  return items;
};

const collections = (
  isCurator: boolean,
  enableCloud: boolean,
  enableEnterprise: boolean,
  settings: CombinedSettings | null,
  kgExposed: boolean,
  customAnalyticsEnabled: boolean
) => [
  {
    name: "Connectors",
    items: connectors_items(),
  },
  {
    name: "Document Management",
    items: document_management_items(),
  },
  {
    name: "Custom Assistants",
    items: custom_assistants_items(isCurator, enableEnterprise),
  },
  ...(isCurator
    ? [
        {
          name: "User Management",
          items: [
            {
              name: "Groups",
              icon: SvgUsers,
              link: "/admin/groups",
            },
          ],
        },
      ]
    : []),
  ...(!isCurator
    ? [
        {
          name: "Configuration",
          items: [
            {
              name: "Default Assistant",
              icon: SvgOnyxLogo,
              link: "/admin/configuration/default-assistant",
            },
            {
              name: "LLM",
              icon: SvgCpu,
              link: "/admin/configuration/llm",
            },
            {
              name: "Web Search",
              icon: SvgGlobe,
              link: "/admin/configuration/web-search",
            },
            {
              name: "Image Generation",
              icon: SvgImage,
              link: "/admin/configuration/image-generation",
            },
            ...(!enableCloud
              ? [
                  {
                    error: settings?.settings.needs_reindexing,
                    name: "Search Settings",
                    icon: SvgSearch,
                    link: "/admin/configuration/search",
                  },
                ]
              : []),
            {
              name: "Document Processing",
              icon: SvgFileText,
              link: "/admin/configuration/document-processing",
            },
            ...(kgExposed
              ? [
                  {
                    name: "Knowledge Graph",
                    icon: BrainIcon,
                    link: "/admin/kg",
                  },
                ]
              : []),
          ],
        },
        {
          name: "User Management",
          items: [
            {
              name: "Users",
              icon: SvgUser,
              link: "/admin/users",
            },
            ...(enableEnterprise
              ? [
                  {
                    name: "Groups",
                    icon: SvgUsers,
                    link: "/admin/groups",
                  },
                ]
              : []),
            {
              name: "API Keys",
              icon: SvgKey,
              link: "/admin/api-key",
            },
            {
              name: "Token Rate Limits",
              icon: SvgShield,
              link: "/admin/token-rate-limits",
            },
          ],
        },
        ...(enableEnterprise
          ? [
              {
                name: "Performance",
                items: [
                  {
                    name: "Usage Statistics",
                    icon: SvgActivity,
                    link: "/admin/performance/usage",
                  },
                  ...(settings?.settings.query_history_type !== "disabled"
                    ? [
                        {
                          name: "Query History",
                          icon: SvgServer,
                          link: "/admin/performance/query-history",
                        },
                      ]
                    : []),
                  ...(!enableCloud && customAnalyticsEnabled
                    ? [
                        {
                          name: "Custom Analytics",
                          icon: SvgBarChart,
                          link: "/admin/performance/custom-analytics",
                        },
                      ]
                    : []),
                ],
              },
            ]
          : []),
        {
          name: "Settings",
          items: [
            {
              name: "Workspace Settings",
              icon: SvgSettings,
              link: "/admin/settings",
            },
            ...(enableEnterprise
              ? [
                  {
                    name: "Appearance & Theming",
                    icon: SvgPaintBrush,
                    link: "/admin/theme",
                  },
                ]
              : []),
            ...(enableCloud
              ? [
                  {
                    name: "Billing",
                    icon: MdOutlineCreditCard,
                    link: "/admin/billing",
                  },
                ]
              : []),
          ],
        },
      ]
    : []),
];

interface AdminSidebarProps {
  // These props are passed down from a server component (Layout.tsx) that
  // determines feature availability server-side. We don't calculate these
  // directly in this client component to avoid:
  // 1. Unnecessary API calls on the client-side
  // 2. Security concerns - preventing end-users from tampering with
  //    feature flags by making direct API calls
  // 3. Performance - avoiding refetches when the data is already available
  enableCloudSS: boolean;
  enableEnterpriseSS: boolean;
}

export default function AdminSidebar({
  enableCloudSS,
  enableEnterpriseSS,
}: AdminSidebarProps) {
  const isChinese = useLanguage().language === "zh";
  const { kgExposed } = useIsKGExposed();
  const pathname = usePathname();
  const { customAnalyticsEnabled } = useCustomAnalyticsEnabled();
  const { user } = useUser();
  const settings = useSettingsContext();

  const isCurator =
    user?.role === UserRole.CURATOR || user?.role === UserRole.GLOBAL_CURATOR;

  const items = collections(
    isCurator,
    enableCloudSS,
    enableEnterpriseSS,
    settings,
    kgExposed,
    customAnalyticsEnabled
  );

  return (
    <SidebarWrapper>
      <SidebarBody
        scrollKey="admin-sidebar"
        actionButtons={
          <SidebarTab
            leftIcon={({ className }) => (
              <CgArrowsExpandUpLeft className={className} size={16} />
            )}
            href="/chat"
          >
            {isChinese ? "退出管理后台" : "Exit Admin"}
          </SidebarTab>
        }
        footer={
          <div className="flex flex-col gap-2">
            {settings.webVersion && (
              <Text as="p" text02 secondaryBody className="px-2">
                {`Clover version: ${settings.webVersion}`}
              </Text>
            )}
            <UserAvatarPopover />
          </div>
        }
      >
        {items.map((collection, index) => (
          <SidebarSection key={index} title={adminLabel(collection.name, isChinese)}>
            <div className="flex flex-col w-full">
              {collection.items.map(({ link, icon: Icon, name }, index) => (
                <SidebarTab
                  key={index}
                  href={link}
                  transient={pathname?.startsWith(link) ?? false}
                  leftIcon={({ className }) => (
                    <Icon className={className} size={16} />
                  )}
                >
                  {adminLabel(name, isChinese)}
                </SidebarTab>
              ))}
            </div>
          </SidebarSection>
        ))}
      </SidebarBody>
    </SidebarWrapper>
  );
}

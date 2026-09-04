"use client";

import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { BooleanFormField } from "@/components/Field";
import { ToolSnapshot, MCPServer } from "@/lib/tools/interfaces";
import { MCPServerSection } from "./FormSections";
import { MemoizedToolList } from "./MemoizedToolCheckboxes";
import Text from "@/refresh-components/texts/Text";
import {
  SEARCH_TOOL_ID,
  WEB_SEARCH_TOOL_ID,
  IMAGE_GENERATION_TOOL_ID,
  PYTHON_TOOL_ID,
  OPEN_URL_TOOL_ID,
} from "@/app/chat/components/tools/constants";
import { HoverPopup } from "@/components/HoverPopup";
import { Info } from "lucide-react";

interface ToolSelectorProps {
  tools: ToolSnapshot[];
  mcpServers?: MCPServer[];
  enabledToolsMap: { [key: number]: boolean };
  setFieldValue?: (field: string, value: any) => void;
  imageGenerationDisabled?: boolean;
  imageGenerationDisabledTooltip?: string;
  searchToolDisabled?: boolean;
  searchToolDisabledTooltip?: string;
  hideSearchTool?: boolean;
}

export function ToolSelector({
  tools,
  mcpServers = [],
  enabledToolsMap,
  setFieldValue,
  imageGenerationDisabled = false,
  imageGenerationDisabledTooltip,
  searchToolDisabled = false,
  searchToolDisabledTooltip,
  hideSearchTool = false,
}: ToolSelectorProps) {
  const searchTool = tools.find((t) => t.in_code_tool_id === SEARCH_TOOL_ID);
  const webSearchTool = tools.find(
    (t) => t.in_code_tool_id === WEB_SEARCH_TOOL_ID
  );
  const imageGenerationTool = tools.find(
    (t) => t.in_code_tool_id === IMAGE_GENERATION_TOOL_ID
  );
  const pythonTool = tools.find((t) => t.in_code_tool_id === PYTHON_TOOL_ID);
  const openUrlTool = tools.find((t) => t.in_code_tool_id === OPEN_URL_TOOL_ID);

  const localizedToolName = (tool: ToolSnapshot) => {
    const names: Record<string, string> = {
      [SEARCH_TOOL_ID]: "内部搜索",
      [WEB_SEARCH_TOOL_ID]: "网页搜索",
      [IMAGE_GENERATION_TOOL_ID]: "图像生成",
      [PYTHON_TOOL_ID]: "代码解释器",
      [OPEN_URL_TOOL_ID]: "打开网址",
    };
    return names[tool.in_code_tool_id] || tool.display_name;
  };

  // Check if Web Search is enabled - if so, OpenURL must be enabled
  const isWebSearchEnabled = webSearchTool && enabledToolsMap[webSearchTool.id];
  const isOpenUrlForced = isWebSearchEnabled;

  const { mcpTools, customTools, mcpToolsByServer } = useMemo(() => {
    const allCustom = tools.filter(
      (tool) =>
        tool.in_code_tool_id !== SEARCH_TOOL_ID &&
        tool.in_code_tool_id !== IMAGE_GENERATION_TOOL_ID &&
        tool.in_code_tool_id !== WEB_SEARCH_TOOL_ID &&
        tool.in_code_tool_id !== PYTHON_TOOL_ID &&
        tool.in_code_tool_id !== OPEN_URL_TOOL_ID
    );

    const mcp = allCustom.filter((tool) => tool.mcp_server_id);
    const custom = allCustom.filter((tool) => !tool.mcp_server_id);

    const groups: { [serverId: number]: ToolSnapshot[] } = {};
    mcp.forEach((tool) => {
      if (tool.mcp_server_id) {
        if (!groups[tool.mcp_server_id]) {
          groups[tool.mcp_server_id] = [];
        }
        groups[tool.mcp_server_id]!.push(tool);
      }
    });

    return { mcpTools: mcp, customTools: custom, mcpToolsByServer: groups };
  }, [tools]);

  const [collapsedServers, setCollapsedServers] = useState<Set<number>>(
    () => new Set(Object.keys(mcpToolsByServer).map((id) => parseInt(id, 10)))
  );

  const seenServerIdsRef = useRef<Set<number>>(
    new Set(Object.keys(mcpToolsByServer).map((id) => parseInt(id, 10)))
  );

  useEffect(() => {
    const serverIds = Object.keys(mcpToolsByServer).map((id) =>
      parseInt(id, 10)
    );
    const unseenIds = serverIds.filter(
      (id) => !seenServerIdsRef.current.has(id)
    );

    if (unseenIds.length === 0) return;

    const updatedSeen = new Set(seenServerIdsRef.current);
    unseenIds.forEach((id) => updatedSeen.add(id));
    seenServerIdsRef.current = updatedSeen;

    setCollapsedServers((prev) => {
      const next = new Set(prev);
      unseenIds.forEach((id) => next.add(id));
      return next;
    });
  }, [mcpToolsByServer]);

  const toggleServerCollapse = useCallback((serverId: number) => {
    setCollapsedServers((prev) => {
      const next = new Set(prev);
      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        next.add(serverId);
      }
      return next;
    });
  }, []);

  const toggleMCPServerTools = useCallback(
    (serverId: number) => {
      if (!setFieldValue) return;

      const serverTools = mcpToolsByServer[serverId] || [];
      const enabledCount = serverTools.filter(
        (tool) => enabledToolsMap[tool.id]
      ).length;
      const shouldEnable = enabledCount !== serverTools.length;

      const updatedMap = { ...enabledToolsMap };
      serverTools.forEach((tool) => {
        updatedMap[tool.id] = shouldEnable;
      });

      setFieldValue("enabled_tools_map", updatedMap);
    },
    [mcpToolsByServer, enabledToolsMap, setFieldValue]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Text as="p" mainUiBody text04>
          内置操作
        </Text>
        <HoverPopup
          mainContent={
            <Info className="h-3.5 w-3.5 text-text-400 cursor-help" />
          }
          popupContent={
            <div className="text-xs space-y-2 max-w-xs bg-background-neutral-dark-03 text-text-light-05">
              <div>
                <span className="font-semibold">内部搜索：</span>至少配置一个连接器后，才能搜索组织知识库。
              </div>
              <div>
                <span className="font-semibold">网页搜索：</span>请在“网页搜索”管理页配置服务商后启用此工具。
              </div>
              <div>
                <span className="font-semibold">图像生成：</span>请在“管理面板 → 配置 → 大语言模型”中添加带 API 密钥的 OpenAI 服务商。
              </div>
              <div>
                <span className="font-semibold">代码解释器：</span>需要配置有效的代码解释器服务地址。
              </div>
              <div>
                <div>
                  <span className="font-semibold">打开网址：</span>打开并阅读对话中提供的网址内容。
                </div>
                {openUrlTool && setFieldValue && (
                  <label className="flex items-center gap-2 cursor-pointer mt-1.5 ml-1">
                    <input
                      type="checkbox"
                      checked={enabledToolsMap[openUrlTool.id] || false}
                      onChange={(e) => {
                        if (!isOpenUrlForced) {
                          setFieldValue(
                            `enabled_tools_map.${openUrlTool.id}`,
                            e.target.checked
                          );
                        }
                      }}
                      disabled={isOpenUrlForced}
                      className="h-3.5 w-3.5 rounded border-border-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-xs">
                      启用打开网址
                      {isOpenUrlForced && (
                        <span className="text-text-500 ml-1">
                          （网页搜索必需）
                        </span>
                      )}
                    </span>
                  </label>
                )}
              </div>
            </div>
          }
          direction="bottom"
        />
      </div>
      {!hideSearchTool && searchTool && (
        <BooleanFormField
          name={`enabled_tools_map.${searchTool.id}`}
          label={localizedToolName(searchTool)}
          subtext="搜索组织知识库和文档"
          disabled={searchToolDisabled}
          disabledTooltip={searchToolDisabledTooltip}
        />
      )}

      {webSearchTool && (
        <BooleanFormField
          name={`enabled_tools_map.${webSearchTool.id}`}
          label={localizedToolName(webSearchTool)}
          subtext="获取实时信息并搜索网页中的最新结果"
          onChange={(checked) => {
            // When enabling Web Search, also enable OpenURL
            if (checked && openUrlTool && setFieldValue) {
              setFieldValue(`enabled_tools_map.${openUrlTool.id}`, true);
            }
          }}
        />
      )}

      {imageGenerationTool && (
        <BooleanFormField
          name={`enabled_tools_map.${imageGenerationTool.id}`}
          label={localizedToolName(imageGenerationTool)}
          subtext="使用 AI 工具生成和编辑图像。"
          disabled={imageGenerationDisabled}
          disabledTooltip={imageGenerationDisabledTooltip}
        />
      )}

      {pythonTool && (
        <BooleanFormField
          name={`enabled_tools_map.${pythonTool.id}`}
          label={localizedToolName(pythonTool)}
          subtext={
            "在安全隔离环境中运行 Python，用于数据分析、可视化和计算"
          }
        />
      )}

      {customTools.length > 0 && (
        <>
          <Text as="p" mainUiBody text04 className="mb-2">
            OpenAPI 操作
          </Text>
          <MemoizedToolList tools={customTools} />
        </>
      )}

      {Object.keys(mcpToolsByServer).length > 0 && (
        <>
          <Text as="p" mainUiBody text04 className="mb-2">
            MCP 操作
          </Text>
          {Object.entries(mcpToolsByServer).map(([serverId, serverTools]) => {
            const serverIdNum = parseInt(serverId);
            const serverInfo =
              mcpServers.find((server) => server.id === serverIdNum) || null;
            const isCollapsed = collapsedServers.has(serverIdNum);

            const firstTool = serverTools[0];
            const serverName =
              serverInfo?.name ||
              firstTool?.name?.split("_").slice(0, -1).join("_") ||
              `MCP Server ${serverId}`;
            const serverUrl = serverInfo?.server_url || "Unknown URL";

            return (
              <MCPServerSection
                key={`mcp-server-${serverId}`}
                serverId={serverIdNum}
                serverTools={serverTools}
                serverName={serverName}
                serverUrl={serverUrl}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleServerCollapse}
                onToggleServerTools={() => toggleMCPServerTools(serverIdNum)}
              />
            );
          })}
        </>
      )}
    </div>
  );
}

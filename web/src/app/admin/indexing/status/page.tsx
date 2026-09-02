"use client";

import { NotebookIcon } from "@/components/icons/icons";
import { CCPairIndexingStatusTable } from "./CCPairIndexingStatusTable";
import { SearchAndFilterControls } from "./SearchAndFilterControls";
import { AdminPageTitle } from "@/components/admin/Title";
import Link from "next/link";
import Text from "@/components/ui/text";
import { useConnectorIndexingStatusWithPagination } from "@/lib/hooks";
import { usePopupFromQuery } from "@/components/popup/PopupFromQuery";
import Button from "@/refresh-components/buttons/Button";
import { useState, useRef, useMemo, RefObject } from "react";
import { FilterOptions } from "./FilterComponent";
import { ValidSources } from "@/lib/types";
import Cookies from "js-cookie";
import { TOGGLED_CONNECTORS_COOKIE_NAME } from "@/lib/constants";
import { ConnectorStaggeredSkeleton } from "./ConnectorRowSkeleton";
import { IndexingStatusRequest } from "@/lib/types";
import { useLanguage } from "@/hooks/useLanguage";

function Main() {
  const isChinese = useLanguage().language === "zh";
  // State for filter management
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    accessType: null,
    docsCountFilter: {
      operator: null,
      value: null,
    },
    lastStatus: null,
  });

  // State for search
  const [searchQuery, setSearchQuery] = useState<string>("");

  // State for collapse/expand functionality
  const [connectorsToggled, setConnectorsToggled] = useState<
    Record<ValidSources, boolean>
  >(() => {
    const savedState = Cookies.get(TOGGLED_CONNECTORS_COOKIE_NAME);
    return savedState ? JSON.parse(savedState) : {};
  });

  // Reference to the FilterComponent for resetting its state
  const filterComponentRef = useRef<{
    resetFilters: () => void;
  }>(null);

  // Convert filter options to API request format
  const request: IndexingStatusRequest = useMemo(() => {
    return {
      secondary_index: false,
      access_type_filters: filterOptions.accessType || [],
      last_status_filters: filterOptions.lastStatus || [],
      docs_count_operator: filterOptions.docsCountFilter.operator,
      docs_count_value: filterOptions.docsCountFilter.value,
      name_filter: searchQuery,
    };
  }, [filterOptions, searchQuery]);

  // Use the paginated hook with filter request and 30-second refresh
  const {
    data: ccPairsIndexingStatuses,
    isLoading: isLoadingCcPairsIndexingStatuses,
    error: ccPairsIndexingStatusesError,
    handlePageChange,
    sourcePages,
    sourceLoadingStates,
    resetPagination,
  } = useConnectorIndexingStatusWithPagination(request, 30000);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (filterOptions.accessType && filterOptions.accessType.length > 0) ||
      (filterOptions.lastStatus && filterOptions.lastStatus.length > 0) ||
      filterOptions.docsCountFilter.operator !== null
    );
  }, [filterOptions]);

  // Handle filter changes
  const handleFilterChange = (newFilterOptions: FilterOptions) => {
    setFilterOptions(newFilterOptions);
    // Reset pagination when filters change
    resetPagination();
  };

  // Toggle source expand/collapse functions
  const toggleSource = (
    source: ValidSources,
    toggled: boolean | null = null
  ) => {
    const newConnectorsToggled = {
      ...connectorsToggled,
      [source]: toggled == null ? !connectorsToggled[source] : toggled,
    };
    setConnectorsToggled(newConnectorsToggled);
    Cookies.set(
      TOGGLED_CONNECTORS_COOKIE_NAME,
      JSON.stringify(newConnectorsToggled)
    );
  };

  const expandAll = () => {
    if (!ccPairsIndexingStatuses) return;
    const newConnectorsToggled = { ...connectorsToggled };
    ccPairsIndexingStatuses.forEach((ccPairStatus) => {
      newConnectorsToggled[ccPairStatus.source] = true;
    });
    setConnectorsToggled(newConnectorsToggled);
    Cookies.set(
      TOGGLED_CONNECTORS_COOKIE_NAME,
      JSON.stringify(newConnectorsToggled)
    );
  };

  const collapseAll = () => {
    if (!ccPairsIndexingStatuses) return;
    const newConnectorsToggled = { ...connectorsToggled };
    ccPairsIndexingStatuses.forEach((ccPairStatus) => {
      newConnectorsToggled[ccPairStatus.source] = false;
    });
    setConnectorsToggled(newConnectorsToggled);
    Cookies.set(
      TOGGLED_CONNECTORS_COOKIE_NAME,
      JSON.stringify(newConnectorsToggled)
    );
  };

  // Check if any sources are expanded
  const hasExpandedSources =
    ccPairsIndexingStatuses?.some(
      (ccPairStatus) => connectorsToggled[ccPairStatus.source]
    ) || false;

  // Handler functions for the search and filter controls
  const handleClearFilters = () => {
    if (filterComponentRef.current) {
      filterComponentRef.current.resetFilters();
      setFilterOptions({
        accessType: null,
        docsCountFilter: {
          operator: null,
          value: null,
        },
        lastStatus: null,
      });
    }
  };

  if (ccPairsIndexingStatusesError) {
    return (
      <div className="text-error">
        {ccPairsIndexingStatusesError?.info?.detail ||
          (isChinese ? "加载索引状态时出错。" : "Error loading indexing status.")}
      </div>
    );
  }

  return (
    <div>
      {/* Search bar and controls */}
      <SearchAndFilterControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        hasExpandedSources={hasExpandedSources}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        resetPagination={resetPagination}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        filterComponentRef={
          filterComponentRef as RefObject<{ resetFilters: () => void }>
        }
      />

      {/* Table component */}
      {isLoadingCcPairsIndexingStatuses ? (
        <div className="mt-12">
          <ConnectorStaggeredSkeleton rowCount={8} standalone={true} />
        </div>
      ) : !ccPairsIndexingStatuses || ccPairsIndexingStatuses.length === 0 ? (
        <Text className="mt-12">
          {isChinese
            ? "你还没有配置任何连接器。请访问"
            : "It looks like you don&apos;t have any connectors setup yet. Visit the "}{" "}
          <Link className="text-link" href="/admin/add-connector">
            {isChinese ? "添加连接器" : "Add Connector"}
          </Link>{" "}
          {isChinese ? "页面开始配置。" : "page to get started!"}
        </Text>
      ) : (
        <CCPairIndexingStatusTable
          ccPairsIndexingStatuses={ccPairsIndexingStatuses}
          connectorsToggled={connectorsToggled}
          toggleSource={toggleSource}
          onPageChange={handlePageChange}
          sourceLoadingStates={sourceLoadingStates}
        />
      )}
    </div>
  );
}

export default function Status() {
  const isChinese = useLanguage().language === "zh";
  const { popup } = usePopupFromQuery({
    "connector-created": {
        message: isChinese ? "连接器创建成功" : "Connector created successfully",
      type: "success",
    },
    "connector-deleted": {
        message: isChinese ? "连接器删除成功" : "Connector deleted successfully",
      type: "success",
    },
  });

  return (
    <>
      {popup}
      <AdminPageTitle
        icon={<NotebookIcon size={32} />}
        title={isChinese ? "已有连接器" : "Existing Connectors"}
        farRightElement={
          <Button href="/admin/add-connector">
            {isChinese ? "添加连接器" : "Add Connector"}
          </Button>
        }
      />

      <Main />
    </>
  );
}

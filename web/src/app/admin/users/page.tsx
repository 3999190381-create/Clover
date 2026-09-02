"use client";

import { useState } from "react";
import SimpleTabs from "@/refresh-components/SimpleTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InvitedUserTable from "@/components/admin/users/InvitedUserTable";
import SignedUpUserTable from "@/components/admin/users/SignedUpUserTable";

import Modal from "@/refresh-components/Modal";
import { ThreeDotsLoader } from "@/components/Loading";
import { AdminPageTitle } from "@/components/admin/Title";
import { usePopup, PopupSpec } from "@/components/admin/connectors/Popup";
import { errorHandlingFetcher } from "@/lib/fetcher";
import useSWR, { mutate } from "swr";
import { ErrorCallout } from "@/components/ErrorCallout";
import BulkAdd from "@/components/admin/users/BulkAdd";
import Text from "@/refresh-components/texts/Text";
import { InvitedUserSnapshot } from "@/lib/types";
import { ConfirmEntityModal } from "@/components/modals/ConfirmEntityModal";
import { AuthType, NEXT_PUBLIC_CLOUD_ENABLED } from "@/lib/constants";
import PendingUsersTable from "@/components/admin/users/PendingUsersTable";
import CreateButton from "@/refresh-components/buttons/CreateButton";
import Button from "@/refresh-components/buttons/Button";
import InputTypeIn from "@/refresh-components/inputs/InputTypeIn";
import { Spinner } from "@/components/Spinner";
import { useAuthType } from "@/lib/hooks";
import { SvgDownloadCloud, SvgUser, SvgUserPlus } from "@opal/icons";
import { useLanguage } from "@/hooks/useLanguage";
interface CountDisplayProps {
  label: string;
  value: number | null;
  isLoading: boolean;
}

function CountDisplay({ label, value, isLoading }: CountDisplayProps) {
  const displayValue = isLoading
    ? "..."
    : value === null
      ? "-"
      : value.toLocaleString();

  return (
    <div className="flex items-center gap-1 px-1 py-0.5 rounded-06">
      <Text as="p" mainUiMuted text03>
        {label}
      </Text>
      <Text as="p" headingH3 text05>
        {displayValue}
      </Text>
    </div>
  );
}

const UsersTables = ({
  q,
  setPopup,
  isDownloadingUsers,
  setIsDownloadingUsers,
}: {
  q: string;
  setPopup: (spec: PopupSpec) => void;
  isDownloadingUsers: boolean;
  setIsDownloadingUsers: (loading: boolean) => void;
}) => {
  const isChinese = useLanguage().language === "zh";
  const [currentUsersCount, setCurrentUsersCount] = useState<number | null>(
    null
  );
  const [currentUsersLoading, setCurrentUsersLoading] = useState<boolean>(true);

  const downloadAllUsers = async () => {
    setIsDownloadingUsers(true);
    const startTime = Date.now();
    const minDurationMsForSpinner = 1000;
    try {
      const response = await fetch("/api/manage/users/download");
      if (!response.ok) {
        throw new Error("Failed to download all users");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor_tag = document.createElement("a");
      anchor_tag.href = url;
      anchor_tag.download = "users.csv";
      document.body.appendChild(anchor_tag);
      anchor_tag.click();
      //Clean up URL after download to avoid memory leaks
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor_tag);
    } catch (error) {
      setPopup({
        message: `Failed to download all users - ${error}`,
        type: "error",
      });
    } finally {
      //Ensure spinner is visible for at least 1 second
      //This is to avoid the spinner disappearing too quickly
      const endTime = Date.now();
      const duration = endTime - startTime;
      await new Promise((resolve) =>
        setTimeout(resolve, minDurationMsForSpinner - duration)
      );
      setIsDownloadingUsers(false);
    }
  };

  const {
    data: invitedUsers,
    error: invitedUsersError,
    isLoading: invitedUsersLoading,
    mutate: invitedUsersMutate,
  } = useSWR<InvitedUserSnapshot[]>(
    "/api/manage/users/invited",
    errorHandlingFetcher
  );

  const { data: validDomains, error: domainsError } = useSWR<string[]>(
    "/api/manage/admin/valid-domains",
    errorHandlingFetcher
  );

  const {
    data: pendingUsers,
    error: pendingUsersError,
    isLoading: pendingUsersLoading,
    mutate: pendingUsersMutate,
  } = useSWR<InvitedUserSnapshot[]>(
    NEXT_PUBLIC_CLOUD_ENABLED ? "/api/tenants/users/pending" : null,
    errorHandlingFetcher
  );

  const invitedUsersCount =
    invitedUsers === undefined ? null : invitedUsers.length;
  const pendingUsersCount =
    pendingUsers === undefined ? null : pendingUsers.length;
  // Show loading animation only during the initial data fetch
  if (!validDomains) {
    return <ThreeDotsLoader />;
  }

  if (domainsError) {
    return (
      <ErrorCallout
        errorTitle={isChinese ? "加载有效域名失败" : "Error loading valid domains"}
        errorMsg={domainsError?.info?.detail}
      />
    );
  }

  const tabs = SimpleTabs.generateTabs({
    current: {
      name: isChinese ? "当前用户" : "Current Users",
      content: (
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center gap-1">
              <CardTitle>{isChinese ? "当前用户" : "Current Users"}</CardTitle>
              <Button
                leftIcon={SvgDownloadCloud}
                disabled={isDownloadingUsers}
                onClick={() => downloadAllUsers()}
              >
                {isDownloadingUsers ? (isChinese ? "下载中..." : "Downloading...") : isChinese ? "下载 CSV" : "Download CSV"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SignedUpUserTable
              invitedUsers={invitedUsers || []}
              setPopup={setPopup}
              q={q}
              invitedUsersMutate={invitedUsersMutate}
              countDisplay={
                <CountDisplay
                  label={isChinese ? "用户总数" : "Total users"}
                  value={currentUsersCount}
                  isLoading={currentUsersLoading}
                />
              }
              onTotalItemsChange={(count) => setCurrentUsersCount(count)}
              onLoadingChange={(loading) => {
                setCurrentUsersLoading(loading);
                if (loading) {
                  setCurrentUsersCount(null);
                }
              }}
            />
          </CardContent>
        </Card>
      ),
    },
    invited: {
      name: isChinese ? "已邀请用户" : "Invited Users",
      content: (
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center gap-1">
              <CardTitle>{isChinese ? "已邀请用户" : "Invited Users"}</CardTitle>
              <CountDisplay
                label={isChinese ? "邀请总数" : "Total invited"}
                value={invitedUsersCount}
                isLoading={invitedUsersLoading}
              />
            </div>
          </CardHeader>
          <CardContent>
            <InvitedUserTable
              users={invitedUsers || []}
              setPopup={setPopup}
              mutate={invitedUsersMutate}
              error={invitedUsersError}
              isLoading={invitedUsersLoading}
              q={q}
            />
          </CardContent>
        </Card>
      ),
    },
    ...(NEXT_PUBLIC_CLOUD_ENABLED && {
      pending: {
        name: isChinese ? "待处理用户" : "Pending Users",
        content: (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center gap-1">
                <CardTitle>{isChinese ? "待处理用户" : "Pending Users"}</CardTitle>
                <CountDisplay
                  label={isChinese ? "待处理总数" : "Total pending"}
                  value={pendingUsersCount}
                  isLoading={pendingUsersLoading}
                />
              </div>
            </CardHeader>
            <CardContent>
              <PendingUsersTable
                users={pendingUsers || []}
                setPopup={setPopup}
                mutate={pendingUsersMutate}
                error={pendingUsersError}
                isLoading={pendingUsersLoading}
                q={q}
              />
            </CardContent>
          </Card>
        ),
      },
    }),
  });

  return <SimpleTabs tabs={tabs} defaultValue="current" />;
};

const SearchableTables = () => {
  const isChinese = useLanguage().language === "zh";
  const { popup, setPopup } = usePopup();
  const [query, setQuery] = useState("");
  const [isDownloadingUsers, setIsDownloadingUsers] = useState(false);

  return (
    <div>
      {isDownloadingUsers && <Spinner />}
      {popup}
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-row items-center gap-2">
          <InputTypeIn
            placeholder={isChinese ? "搜索" : "Search"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <AddUserButton setPopup={setPopup} />
        </div>
        <UsersTables
          q={query}
          setPopup={setPopup}
          isDownloadingUsers={isDownloadingUsers}
          setIsDownloadingUsers={setIsDownloadingUsers}
        />
      </div>
    </div>
  );
};

const AddUserButton = ({
  setPopup,
}: {
  setPopup: (spec: PopupSpec) => void;
}) => {
  const [bulkAddUsersModal, setBulkAddUsersModal] = useState(false);
  const isChinese = useLanguage().language === "zh";
  const [firstUserConfirmationModal, setFirstUserConfirmationModal] =
    useState(false);
  const authType = useAuthType();

  const { data: invitedUsers } = useSWR<InvitedUserSnapshot[]>(
    "/api/manage/users/invited",
    errorHandlingFetcher
  );

  const shouldShowFirstInviteWarning =
    !NEXT_PUBLIC_CLOUD_ENABLED &&
    authType !== null &&
    authType !== AuthType.SAML &&
    authType !== AuthType.OIDC &&
    invitedUsers &&
    invitedUsers.length === 0;

  const onSuccess = () => {
    mutate(
      (key) => typeof key === "string" && key.startsWith("/api/manage/users")
    );
    setBulkAddUsersModal(false);
    setPopup({
      message: isChinese ? "用户已邀请！" : "Users invited!",
      type: "success",
    });
  };

  const onFailure = async (res: Response) => {
    const error = (await res.json()).detail;
    setPopup({
      message: `${isChinese ? "邀请用户失败" : "Failed to invite users"} - ${error}`,
      type: "error",
    });
  };

  const handleInviteClick = () => {
    if (shouldShowFirstInviteWarning) {
      setFirstUserConfirmationModal(true);
    } else {
      setBulkAddUsersModal(true);
    }
  };

  const handleConfirmFirstInvite = () => {
    setFirstUserConfirmationModal(false);
    setBulkAddUsersModal(true);
  };

  return (
    <>
      <CreateButton primary onClick={handleInviteClick}>
        {isChinese ? "邀请用户" : "Invite Users"}
      </CreateButton>

      {firstUserConfirmationModal && (
        <ConfirmEntityModal
          entityType={isChinese ? "首次邀请用户" : "First User Invitation"}
          entityName="your Access Logic"
          onClose={() => setFirstUserConfirmationModal(false)}
          onSubmit={handleConfirmFirstInvite}
          additionalDetails={isChinese ? "邀请第一位用户后，只有受邀用户才能加入此平台。这是用于控制团队访问权限的安全措施。" : "After inviting the first user, only invited users will be able to join this platform. This is a security measure to control access to your team."}
          actionButtonText={isChinese ? "继续" : "Continue"}
        />
      )}

      {bulkAddUsersModal && (
        <Modal open onOpenChange={() => setBulkAddUsersModal(false)}>
          <Modal.Content>
            <Modal.Header
              icon={SvgUserPlus}
              title={isChinese ? "批量添加用户" : "Bulk Add Users"}
              onClose={() => setBulkAddUsersModal(false)}
            />
            <Modal.Body>
              <div className="flex flex-col gap-2">
                <Text as="p">
                  {isChinese ? "输入要导入的邮箱地址，以空格分隔。受邀用户可以使用邮箱登录此域名。" : "Add the email addresses to import, separated by whitespaces. Invited users will be able to login to this domain with their email address."}
                </Text>
                <BulkAdd onSuccess={onSuccess} onFailure={onFailure} />
              </div>
            </Modal.Body>
          </Modal.Content>
        </Modal>
      )}
    </>
  );
};

const Page = () => {
  return (
    <>
      <AdminPageTitle title="Manage Users" icon={SvgUser} />
      <SearchableTables />
    </>
  );
};

export default Page;

"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import SimpleTabs from "@/refresh-components/SimpleTabs";
import Text from "@/components/ui/text";
import { useState } from "react";
import {
  insertGlobalTokenRateLimit,
  insertGroupTokenRateLimit,
  insertUserTokenRateLimit,
} from "./lib";
import { Scope, TokenRateLimit } from "./types";
import { GenericTokenRateLimitTable } from "./TokenRateLimitTables";
import { mutate } from "swr";
import { usePopup } from "@/components/admin/connectors/Popup";
import CreateRateLimitModal from "./CreateRateLimitModal";
import { usePaidEnterpriseFeaturesEnabled } from "@/components/settings/usePaidEnterpriseFeaturesEnabled";
import CreateButton from "@/refresh-components/buttons/CreateButton";
import { SvgGlobe, SvgShield, SvgUser, SvgUsers } from "@opal/icons";
import { Section } from "@/layouts/general-layouts";
import { useLanguage } from "@/hooks/useLanguage";
const BASE_URL = "/api/admin/token-rate-limits";
const GLOBAL_TOKEN_FETCH_URL = `${BASE_URL}/global`;
const USER_TOKEN_FETCH_URL = `${BASE_URL}/users`;
const USER_GROUP_FETCH_URL = `${BASE_URL}/user-groups`;

const GLOBAL_DESCRIPTION =
  "Global rate limits apply to all users, user groups, and API keys. When the global \
  rate limit is reached, no more tokens can be spent.";
const USER_DESCRIPTION =
  "User rate limits apply to individual users. When a user reaches a limit, they will \
  be temporarily blocked from spending tokens.";
const USER_GROUP_DESCRIPTION =
  "User group rate limits apply to all users in a group. When a group reaches a limit, \
  all users in the group will be temporarily blocked from spending tokens, regardless \
  of their individual limits. If a user is in multiple groups, the most lenient limit \
  will apply.";

const handleCreateTokenRateLimit = async (
  target_scope: Scope,
  period_hours: number,
  token_budget: number,
  group_id: number = -1
) => {
  const tokenRateLimitArgs = {
    enabled: true,
    token_budget: token_budget,
    period_hours: period_hours,
  };

  if (target_scope === Scope.GLOBAL) {
    return await insertGlobalTokenRateLimit(tokenRateLimitArgs);
  } else if (target_scope === Scope.USER) {
    return await insertUserTokenRateLimit(tokenRateLimitArgs);
  } else if (target_scope === Scope.USER_GROUP) {
    return await insertGroupTokenRateLimit(tokenRateLimitArgs, group_id);
  } else {
    throw new Error(`Invalid target_scope: ${target_scope}`);
  }
};

function Main() {
  const isChinese = useLanguage().language === "zh";
  const [tabIndex, setTabIndex] = useState(0);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { popup, setPopup } = usePopup();

  const isPaidEnterpriseFeaturesEnabled = usePaidEnterpriseFeaturesEnabled();

  const updateTable = (target_scope: Scope) => {
    if (target_scope === Scope.GLOBAL) {
      mutate(GLOBAL_TOKEN_FETCH_URL);
      setTabIndex(0);
    } else if (target_scope === Scope.USER) {
      mutate(USER_TOKEN_FETCH_URL);
      setTabIndex(1);
    } else if (target_scope === Scope.USER_GROUP) {
      mutate(USER_GROUP_FETCH_URL);
      setTabIndex(2);
    }
  };

  const handleSubmit = (
    target_scope: Scope,
    period_hours: number,
    token_budget: number,
    group_id: number = -1
  ) => {
    handleCreateTokenRateLimit(
      target_scope,
      period_hours,
      token_budget,
      group_id
    )
      .then(() => {
        setModalIsOpen(false);
        setPopup({ type: "success", message: isChinese ? "令牌速率限制已创建！" : "Token rate limit created!" });
        updateTable(target_scope);
      })
      .catch((error) => {
        setPopup({ type: "error", message: error.message });
      });
  };

  return (
    <Section alignItems="stretch" justifyContent="start" height="auto">
      {popup}

      <Text>
        {isChinese ? "令牌速率限制可以控制指定时间段内的令牌消耗量。你可以：" : "Token rate limits enable you control how many tokens can be spent in a given time period. With token rate limits, you can:"}
      </Text>

      <ul className="list-disc ml-4">
        <li>
          <Text>
            {isChinese ? "设置全局速率限制，控制团队整体令牌消耗。" : "Set a global rate limit to control your team's overall token spend."}
          </Text>
        </li>
        {isPaidEnterpriseFeaturesEnabled && (
          <>
            <li>
              <Text>
                {isChinese ? "为用户设置速率限制，避免单个用户消耗过多令牌。" : "Set rate limits for users to ensure that no single user can spend too many tokens."}
              </Text>
            </li>
            <li>
              <Text>
                {isChinese ? "为用户组设置速率限制，控制团队令牌消耗。" : "Set rate limits for user groups to control token spend for your teams."}
              </Text>
            </li>
          </>
        )}
        <li>
          <Text>{isChinese ? "随时启用或停用速率限制。" : "Enable and disable rate limits on the fly."}</Text>
        </li>
      </ul>

      <CreateButton onClick={() => setModalIsOpen(true)}>
        {isChinese ? "创建令牌速率限制" : "Create a Token Rate Limit"}
      </CreateButton>

      {isPaidEnterpriseFeaturesEnabled ? (
        <SimpleTabs
          tabs={{
            "0": {
              name: isChinese ? "全局" : "Global",
              icon: SvgGlobe,
              content: (
                <GenericTokenRateLimitTable
                  fetchUrl={GLOBAL_TOKEN_FETCH_URL}
                  title={"Global Token Rate Limits"}
                  description={GLOBAL_DESCRIPTION}
                />
              ),
            },
            "1": {
              name: isChinese ? "用户" : "User",
              icon: SvgUser,
              content: (
                <GenericTokenRateLimitTable
                  fetchUrl={USER_TOKEN_FETCH_URL}
                  title={"User Token Rate Limits"}
                  description={USER_DESCRIPTION}
                />
              ),
            },
            "2": {
              name: isChinese ? "用户组" : "User Groups",
              icon: SvgUsers,
              content: (
                <GenericTokenRateLimitTable
                  fetchUrl={USER_GROUP_FETCH_URL}
                  title={"User Group Token Rate Limits"}
                  description={USER_GROUP_DESCRIPTION}
                  responseMapper={(data: Record<string, TokenRateLimit[]>) =>
                    Object.entries(data).flatMap(([group_name, elements]) =>
                      elements.map((element) => ({
                        ...element,
                        group_name,
                      }))
                    )
                  }
                />
              ),
            },
          }}
          value={tabIndex.toString()}
          onValueChange={(val) => setTabIndex(parseInt(val))}
        />
      ) : (
        <GenericTokenRateLimitTable
          fetchUrl={GLOBAL_TOKEN_FETCH_URL}
          title={"Global Token Rate Limits"}
          description={GLOBAL_DESCRIPTION}
        />
      )}

      <CreateRateLimitModal
        isOpen={modalIsOpen}
        setIsOpen={() => setModalIsOpen(false)}
        setPopup={setPopup}
        onSubmit={handleSubmit}
        forSpecificScope={
          isPaidEnterpriseFeaturesEnabled ? undefined : Scope.GLOBAL
        }
      />
    </Section>
  );
}

export default function Page() {
  return (
    <>
      <AdminPageTitle title="Token Rate Limits" icon={SvgShield} />
      <Main />
    </>
  );
}

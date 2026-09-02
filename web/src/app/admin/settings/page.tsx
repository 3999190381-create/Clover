"use client";

import { AdminPageTitle } from "@/components/admin/Title";
import { SettingsForm } from "@/app/admin/settings/SettingsForm";
import Text from "@/components/ui/text";
import { SvgSettings } from "@opal/icons";
import { useLanguage } from "@/hooks/useLanguage";

export default function Page() {
  const isChinese = useLanguage().language === "zh";
  return (
    <>
      <AdminPageTitle title="Workspace Settings" icon={SvgSettings} />

      <Text className="mb-8">
        {isChinese ? "管理适用于工作区所有用户的 Clover 通用设置。" : "Manage general Onyx settings applicable to all users in the workspace."}
      </Text>

      <SettingsForm />
    </>
  );
}

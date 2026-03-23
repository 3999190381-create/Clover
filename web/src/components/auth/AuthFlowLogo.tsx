"use client";

import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import { BRAND_LOGO_CACHE_KEY } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AuthFlowLogoProps {
  size?: number;
  className?: string;
}

const DEFAULT_BRAND_LOGO_SRC = `/logo.svg?v=${BRAND_LOGO_CACHE_KEY}`;

export default function AuthFlowLogo({ size = 44, className }: AuthFlowLogoProps) {
  const settings = useContext(SettingsContext);
  const useCustom = settings?.enterpriseSettings?.use_custom_logo;
  const appName = settings?.enterpriseSettings?.application_name;

  const [enterpriseLogoFailed, setEnterpriseLogoFailed] = useState(false);

  useEffect(() => {
    setEnterpriseLogoFailed(false);
  }, [useCustom]);

  const showEnterpriseLogo = Boolean(useCustom) && !enterpriseLogoFailed;

  if (showEnterpriseLogo) {
    return (
      <Image
        src="/api/enterprise-settings/logo"
        alt={appName || "Logo"}
        width={size}
        height={size}
        className={cn("object-contain flex-shrink-0", className)}
        unoptimized
        priority
        onError={() => setEnterpriseLogoFailed(true)}
      />
    );
  }

  return (
    <Image
      src={DEFAULT_BRAND_LOGO_SRC}
      alt={appName || "Logo"}
      width={size}
      height={size}
      className={cn("object-contain flex-shrink-0", className)}
      unoptimized
      priority
    />
  );
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import Link from "next/link";
import { EAuthModes } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

interface TermsAndConditionsProps {
  authType?: EAuthModes;
}

const LEGAL_LINKS = {
  termsOfService: "https://plane.so/legals/terms-and-conditions",
  privacyPolicy: "https://plane.so/legals/privacy-policy",
} as const;

function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-secondary" target="_blank" rel="noopener noreferrer">
      <span className="text-13 font-medium underline hover:cursor-pointer">{children}</span>
    </Link>
  );
}

export function TermsAndConditions({ authType = EAuthModes.SIGN_IN }: TermsAndConditionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center">
      <p className="text-center text-13 whitespace-pre-line text-tertiary">
        {authType === EAuthModes.SIGN_UP
          ? t("auth.common.by_creating_account", "By creating an account, you agree to our ")
          : t("auth.common.by_signing_in", "By signing in, you agree to our ")}
        <LegalLink href={LEGAL_LINKS.termsOfService}>{t("auth.common.terms_of_service", "Terms of Service")}</LegalLink>
        {" "}{t("common.and", "and")}{" "}
        <LegalLink href={LEGAL_LINKS.privacyPolicy}>{t("auth.common.privacy_policy", "Privacy Policy")}</LegalLink>.
      </p>
    </div>
  );
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { EAuthModes } from "@plane/constants";

interface TermsAndConditionsProps {
  authType?: EAuthModes;
}

export function TermsAndConditions({ authType = EAuthModes.SIGN_IN }: TermsAndConditionsProps) {
  const isSignUp = authType === EAuthModes.SIGN_UP;
  return (
    <div className="flex items-center justify-center">
      <p className="text-center text-13 text-tertiary">
        {isSignUp ? "با ایجاد حساب کاربری، " : "با ورود به سیستم، "}
        <span className="font-medium text-secondary">شرایط استفاده از خدمات</span> و{" "}
        <span className="font-medium text-secondary">حریم خصوصی</span> را می‌پذیرید.
      </p>
    </div>
  );
}

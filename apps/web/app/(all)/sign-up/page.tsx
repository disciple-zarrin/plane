/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
// components
import { AuthBase } from "@/components/auth-screens/auth-base";
// helpers
import { EAuthModes, EPageTypes } from "@/helpers/authentication.helper";
import { useInstance } from "@/hooks/store/use-instance";
import { useAppRouter } from "@/hooks/use-app-router";
// assets
import DefaultLayout from "@/layouts/default-layout";
import { AuthenticationWrapper } from "@/lib/wrappers/authentication-wrapper";

const SignUpPage = observer(function SignUpPage() {
  const router = useAppRouter();
  const { config } = useInstance();

  useEffect(() => {
    if (config && config.enable_signup === false) {
      router.replace("/");
    }
  }, [config, router]);

  if (config && config.enable_signup === false) {
    return null;
  }

  return (
    <DefaultLayout>
      <AuthenticationWrapper pageType={EPageTypes.NON_AUTHENTICATED}>
        <AuthBase authType={EAuthModes.SIGN_UP} />
      </AuthenticationWrapper>
    </DefaultLayout>
  );
});

export default SignUpPage;

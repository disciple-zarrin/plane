/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { HesarBackButton } from "@/components/common/hesar-back-button";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";

type TMode = "limited" | "all";

function VersionsSettingsPage() {
  const { t } = useTranslation();
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const canAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const initialLimit = currentWorkspace?.page_version_limit ?? 20;
  const [mode, setMode] = useState<TMode>(initialLimit === 0 ? "all" : "limited");
  const [limitInput, setLimitInput] = useState(String(initialLimit === 0 ? 20 : initialLimit));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const lim = currentWorkspace?.page_version_limit ?? 20;
    setMode(lim === 0 ? "all" : "limited");
    setLimitInput(String(lim === 0 ? 20 : lim));
  }, [currentWorkspace?.page_version_limit, currentWorkspace?.id]);

  if (workspaceUserInfo && !canAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.versions.title")}`
    : undefined;

  const handleSave = async () => {
    if (!currentWorkspace) return;
    let next = 0;
    if (mode === "limited") {
      const parsed = Number.parseInt(limitInput, 10);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 500) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.versions.invalid_limit_title"),
          message: t("workspace_settings.settings.versions.invalid_limit_message"),
        });
        return;
      }
      next = parsed;
    }
    setSaving(true);
    try {
      await updateWorkspace(currentWorkspace.slug, { page_version_limit: next });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.versions.saved_title"),
        message: t("workspace_settings.settings.versions.saved_message"),
      });
    } catch (e) {
      console.error(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.versions.save_error"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsContentWrapper
      header={
        <div className="flex items-center gap-2">
          <HesarBackButton />
        </div>
      }
    >
      <PageHead title={pageTitle} />
      <div className="flex w-full flex-col gap-y-6">
        <SettingsHeading
          title={t("workspace_settings.settings.versions.heading")}
          description={t("workspace_settings.settings.versions.description")}
        />

        <div className="space-y-4 rounded-lg border border-subtle bg-surface-1 p-5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              className="mt-1"
              name="version-retention"
              checked={mode === "limited"}
              onChange={() => setMode("limited")}
            />
            <span className="space-y-1">
              <span className="block text-14 font-medium text-primary">
                {t("workspace_settings.settings.versions.mode_limited")}
              </span>
              <span className="block text-12 text-tertiary">
                {t("workspace_settings.settings.versions.mode_limited_help")}
              </span>
            </span>
          </label>

          {mode === "limited" && (
            <div className="ms-7 max-w-xs space-y-1">
              <label className="text-12 text-secondary" htmlFor="page-version-limit">
                {t("workspace_settings.settings.versions.limit_label")}
              </label>
              <Input
                id="page-version-limit"
                type="number"
                min={1}
                max={500}
                value={limitInput}
                onChange={(e) => setLimitInput(e.target.value)}
                className="w-32"
              />
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              className="mt-1"
              name="version-retention"
              checked={mode === "all"}
              onChange={() => setMode("all")}
            />
            <span className="space-y-1">
              <span className="block text-14 font-medium text-primary">
                {t("workspace_settings.settings.versions.mode_all")}
              </span>
              <span className="block text-12 text-tertiary">
                {t("workspace_settings.settings.versions.mode_all_help")}
              </span>
            </span>
          </label>

          <div className="pt-2">
            <Button variant="primary" onClick={() => void handleSave()} loading={saving} disabled={!canAdmin}>
              {saving ? "…" : t("workspace_settings.settings.versions.save")}
            </Button>
          </div>
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(VersionsSettingsPage);

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane types
import { useTranslation } from "@plane/i18n";
import type { IUser } from "@plane/types";
import { isPersianLocale } from "@plane/utils";
// hooks
import { useCurrentTime } from "@/hooks/use-current-time";

export interface IUserGreetingsView {
  user: IUser;
}

export function UserGreetingsView(props: IUserGreetingsView) {
  const { user } = props;
  const { currentTime } = useCurrentTime();
  const { t } = useTranslation();
  const persian = isPersianLocale();
  const locale = persian ? "fa-IR" : "en-US";
  const timeZone = user?.user_timezone;

  const hour = new Intl.DateTimeFormat(locale, {
    hour12: false,
    hour: "numeric",
    timeZone,
  }).format(currentTime);

  const dateLine = new Intl.DateTimeFormat(locale, {
    ...(persian ? { calendar: "persian" as const } : {}),
    weekday: "long",
    month: persian ? "long" : "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(currentTime);

  const greeting = parseInt(hour, 10) < 12 ? "morning" : parseInt(hour, 10) < 18 ? "afternoon" : "evening";

  return (
    <div className="my-6 flex flex-col items-center">
      <h2 className="text-center text-20 font-semibold">
        {t("good")} {t(greeting)}, {user?.first_name} {user?.last_name}
      </h2>
      <h5 className="flex items-center gap-2 font-medium text-placeholder">
        <div>{greeting === "morning" ? "🌤️" : greeting === "afternoon" ? "🌥️" : "🌙️"}</div>
        <div>{dateLine}</div>
      </h5>
    </div>
  );
}

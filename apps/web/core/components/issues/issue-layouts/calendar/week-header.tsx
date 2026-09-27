/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { EStartOfTheWeek } from "@plane/types";
import { useTranslation } from "@plane/i18n";
import {
  getOrderedDays,
  isPersianLocale,
  getCalendarStartOfWeek,
  isCalendarWeekendWeekday,
} from "@plane/utils";
import { DAYS_LIST } from "@plane/constants";
// helpers
// hooks
import { useUserProfile } from "@/hooks/store/user";

type Props = {
  isLoading: boolean;
  showWeekends: boolean;
};

const DAY_I18N_KEYS: Record<number, string> = {
  [EStartOfTheWeek.SUNDAY]: "common.days.sunday",
  [EStartOfTheWeek.MONDAY]: "common.days.monday",
  [EStartOfTheWeek.TUESDAY]: "common.days.tuesday",
  [EStartOfTheWeek.WEDNESDAY]: "common.days.wednesday",
  [EStartOfTheWeek.THURSDAY]: "common.days.thursday",
  [EStartOfTheWeek.FRIDAY]: "common.days.friday",
  [EStartOfTheWeek.SATURDAY]: "common.days.saturday",
};

export const CalendarWeekHeader = observer(function CalendarWeekHeader(props: Props) {
  const { isLoading, showWeekends } = props;
  // hooks
  const { data } = useUserProfile();
  const { t } = useTranslation();
  const startOfWeek = getCalendarStartOfWeek(data?.start_of_the_week);
  const persian = isPersianLocale();

  // derived
  const orderedDays = getOrderedDays(Object.values(DAYS_LIST), (item) => item.value, startOfWeek);
  const visibleDays = orderedDays.filter((day) => showWeekends || !isCalendarWeekendWeekday(day.value));

  return (
    <div
      className="relative sticky top-0 z-[1] grid divide-subtle-1 text-13 font-medium md:divide-x-[0.5px]"
      style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(0, 1fr))` }}
    >
      {isLoading && (
        <div className="absolute h-[1.5px] w-3/4 animate-[bar-loader_2s_linear_infinite] bg-accent-primary" />
      )}
      {visibleDays.map((day) => (
        <div key={day.shortTitle} className="flex h-11 items-center justify-center bg-layer-1 px-2 md:justify-end">
          {persian ? t(DAY_I18N_KEYS[day.value]) : day.shortTitle}
        </div>
      ))}
    </div>
  );
});

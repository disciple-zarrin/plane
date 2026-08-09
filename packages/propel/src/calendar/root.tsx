/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { DayPicker as PersianDayPicker } from "react-day-picker/persian";
import { ChevronLeftIcon } from "../icons/arrows/chevron-left";
import { isPersianLocale } from "@plane/utils";

import { cn } from "../utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  const currentYear = new Date().getFullYear();
  const thirtyYearsAgoFirstDay = new Date(currentYear - 30, 0, 1);
  const thirtyYearsFromNowFirstDay = new Date(currentYear + 30, 11, 31);
  const usePersian = isPersianLocale();
  const Picker = usePersian ? PersianDayPicker : DayPicker;

  return (
    <Picker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      weekStartsOn={props.weekStartsOn}
      dir={usePersian ? "rtl" : props.dir}
      components={{
        Chevron: ({ className, ...chevronProps }) => (
          <ChevronLeftIcon
            className={cn(
              "size-4",
              {
                "rotate-180": chevronProps.orientation === "right",
                "-rotate-90": chevronProps.orientation === "down",
              },
              className
            )}
            {...chevronProps}
          />
        ),
      }}
      startMonth={thirtyYearsAgoFirstDay}
      endMonth={thirtyYearsFromNowFirstDay}
      {...props}
    />
  );
}

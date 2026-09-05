/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { DayPicker as PersianDayPicker } from "react-day-picker/persian";
import { ChevronLeftOutline } from "@makeplane/propel/icons";
import { isPersianLocale } from "@plane/utils";

import { cn } from "../utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  const currentYear = new Date().getFullYear();
  const thirtyYearsAgoFirstDay = new Date(currentYear - 30, 0, 1);
  const thirtyYearsFromNowFirstDay = new Date(currentYear + 30, 11, 31);
  // Re-evaluate when app language changes (Jalali vs Gregorian picker).
  const [localeTick, setLocaleTick] = React.useState(0);
  React.useEffect(() => {
    const onLang = () => setLocaleTick((n) => n + 1);
    window.addEventListener("plane:language-changed", onLang);
    return () => window.removeEventListener("plane:language-changed", onLang);
  }, []);
  const usePersian = isPersianLocale();
  const Picker = (usePersian ? PersianDayPicker : DayPicker) as React.ComponentType<any>;

  return (
    <Picker
      key={`${usePersian ? "jalali" : "gregorian"}-${localeTick}`}
      {...props}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      dir={usePersian ? "rtl" : props.dir}
      // Persian digits for Jalali day numbers in date pickers.
      {...(usePersian ? { numerals: "arabext" as const } : {})}
      components={{
        Chevron: ({ className, ...chevronProps }: any) => (
          <ChevronLeftOutline
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
        ...props.components,
      }}
      startMonth={props.startMonth ?? thirtyYearsAgoFirstDay}
      endMonth={props.endMonth ?? thirtyYearsFromNowFirstDay}
    />
  );
}

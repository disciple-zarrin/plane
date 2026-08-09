/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observable, action, makeObservable, runInAction, computed, reaction } from "mobx";

// helpers
import { computedFn } from "mobx-utils";
import type { ICalendarPayload, ICalendarWeek } from "@plane/types";
import { EStartOfTheWeek } from "@plane/types";
import { generateCalendarData, getWeekNumberOfDate, renderFormattedPayloadDate, startOfCalendarMonth } from "@plane/utils";
// types
import type { IIssueRootStore } from "./root.store";

export interface ICalendarStore {
  calendarFilters: {
    activeMonthDate: Date;
    activeWeekDate: Date;
  };
  calendarPayload: ICalendarPayload | null;

  // action
  updateCalendarFilters: (filters: Partial<{ activeMonthDate: Date; activeWeekDate: Date }>) => void;
  updateCalendarPayload: (date: Date) => void;
  regenerateCalendar: () => void;

  // computed
  allWeeksOfActiveMonth:
    | {
        [weekNumber: string]: ICalendarWeek;
      }
    | undefined;
  activeWeekNumber: number;
  allDaysOfActiveWeek: ICalendarWeek | undefined;
  getStartAndEndDate: (layout: "week" | "month") => { startDate: string; endDate: string } | undefined;
}

export class CalendarStore implements ICalendarStore {
  loader: boolean = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any | null = null;

  // observables
  calendarFilters: { activeMonthDate: Date; activeWeekDate: Date } = {
    activeMonthDate: new Date(),
    activeWeekDate: new Date(),
  };
  calendarPayload: ICalendarPayload | null = null;
  // root store
  rootStore;

  constructor(_rootStore: IIssueRootStore) {
    makeObservable(this, {
      loader: observable.ref,
      error: observable.ref,

      // observables
      calendarFilters: observable.ref,
      calendarPayload: observable.ref,

      // actions
      updateCalendarFilters: action,
      updateCalendarPayload: action,
      regenerateCalendar: action,

      //computed
      allWeeksOfActiveMonth: computed,
      activeWeekNumber: computed,
      allDaysOfActiveWeek: computed,
    });

    this.rootStore = _rootStore;
    this.initCalendar();

    // Watch for changes in startOfWeek preference and regenerate calendar
    reaction(
      () => this.rootStore.rootStore.user.userProfile.data?.start_of_the_week,
      () => {
        // Regenerate calendar when startOfWeek preference changes
        this.regenerateCalendar();
      }
    );
  }

  get allWeeksOfActiveMonth() {
    if (!this.calendarPayload) return undefined;

    const { activeMonthDate } = this.calendarFilters;

    const year = activeMonthDate.getFullYear();
    const month = activeMonthDate.getMonth();

    // Get the weeks for the current month
    const weeks = this.calendarPayload[`y-${year}`][`m-${month}`];

    // If no weeks exist, return undefined
    if (!weeks) return undefined;

    // Create a new object to store the reordered weeks
    const reorderedWeeks: { [weekNumber: string]: ICalendarWeek } = {};

    // Get all week numbers and sort them
    const weekNumbers = Object.keys(weeks).map((key) => parseInt(key.replace("w-", "")));
    weekNumbers.sort((a, b) => a - b);

    // Reorder weeks based on start_of_week
    weekNumbers.forEach((weekNumber) => {
      const weekKey = `w-${weekNumber}`;
      reorderedWeeks[weekKey] = weeks[weekKey];
    });

    return reorderedWeeks;
  }

  get activeWeekNumber() {
    return getWeekNumberOfDate(this.calendarFilters.activeWeekDate);
  }

  get allDaysOfActiveWeek() {
    if (!this.calendarPayload) return undefined;

    const { activeWeekDate, activeMonthDate } = this.calendarFilters;
    const payloadDate = renderFormattedPayloadDate(activeWeekDate);

    // Prefer the active month payload (supports Jalali month grids keyed by Gregorian y/m of month start)
    const monthStart = startOfCalendarMonth(activeMonthDate);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const yearData = this.calendarPayload[`y-${year}`];
    const monthData = yearData?.[`m-${month}`];

    if (monthData && payloadDate) {
      for (const week of Object.values(monthData)) {
        if (week && payloadDate in week) return week;
      }
    }

    // Fallback: scan entire payload for the date
    if (payloadDate) {
      for (const y of Object.values(this.calendarPayload)) {
        for (const m of Object.values(y || {})) {
          for (const week of Object.values(m || {})) {
            if (week && payloadDate in week) return week;
          }
        }
      }
    }

    return undefined;
  }

  getStartAndEndDate = computedFn((layout: "week" | "month") => {
    switch (layout) {
      case "week": {
        if (!this.allDaysOfActiveWeek) return;
        const dates = Object.keys(this.allDaysOfActiveWeek);
        return { startDate: dates[0], endDate: dates[dates.length - 1] };
      }
      case "month": {
        if (!this.allWeeksOfActiveMonth) return;
        const weeks = Object.keys(this.allWeeksOfActiveMonth);
        const firstWeekDates = Object.keys(this.allWeeksOfActiveMonth[weeks[0]]);
        const lastWeekDates = Object.keys(this.allWeeksOfActiveMonth[weeks[weeks.length - 1]]);

        return { startDate: firstWeekDates[0], endDate: lastWeekDates[lastWeekDates.length - 1] };
      }
    }
  });

  updateCalendarFilters = (filters: Partial<{ activeMonthDate: Date; activeWeekDate: Date }>) => {
    this.updateCalendarPayload(filters.activeMonthDate || filters.activeWeekDate || new Date());

    runInAction(() => {
      this.calendarFilters = {
        ...this.calendarFilters,
        ...filters,
      };
    });
  };

  updateCalendarPayload = (date: Date) => {
    if (!this.calendarPayload) return null;

    const nextDate = new Date(date);
    const startOfWeek = this.rootStore.rootStore.user.userProfile.data?.start_of_the_week ?? EStartOfTheWeek.SUNDAY;

    runInAction(() => {
      this.calendarPayload = generateCalendarData(this.calendarPayload, nextDate, startOfWeek);
    });
  };

  initCalendar = () => {
    const startOfWeek = this.rootStore.rootStore.user.userProfile.data?.start_of_the_week ?? EStartOfTheWeek.SUNDAY;
    const monthStart = startOfCalendarMonth(new Date());
    const newCalendarPayload = generateCalendarData(null, monthStart, startOfWeek);

    runInAction(() => {
      this.calendarFilters = {
        ...this.calendarFilters,
        activeMonthDate: monthStart,
      };
      this.calendarPayload = newCalendarPayload;
    });
  };

  /**
   * Force complete regeneration of calendar data
   * This should be called when startOfWeek preference changes
   */
  regenerateCalendar = () => {
    const startOfWeek = this.rootStore.rootStore.user.userProfile.data?.start_of_the_week ?? EStartOfTheWeek.SUNDAY;
    const { activeMonthDate } = this.calendarFilters;

    // Force complete regeneration by passing null to clear all cached data
    const newCalendarPayload = generateCalendarData(null, activeMonthDate, startOfWeek);

    runInAction(() => {
      this.calendarPayload = newCalendarPayload;
    });
  };
}

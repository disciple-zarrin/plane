/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { computed, makeObservable, observable } from "mobx";
import type { TPage, TPageExtended } from "@plane/types";
import type { CoreRootStore } from "@/store/root.store";
import type { TBasePageServices } from "@/store/pages/base-page";

export type TExtendedPageInstance = TPageExtended & {
  asJSONExtended: TPageExtended;
};

export class ExtendedBasePage implements TExtendedPageInstance {
  parent: string | null | undefined = null;
  is_global: boolean | undefined = false;

  constructor(_store: CoreRootStore, page: TPage, _services: TBasePageServices) {
    this.parent = page.parent ?? null;
    this.is_global = page.is_global ?? false;

    makeObservable(this, {
      parent: observable.ref,
      is_global: observable.ref,
      asJSONExtended: computed,
    });
  }

  get asJSONExtended(): TExtendedPageInstance["asJSONExtended"] {
    return {
      parent: this.parent ?? null,
      is_global: this.is_global ?? false,
    };
  }
}

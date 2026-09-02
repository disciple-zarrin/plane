/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

type TSubpageHandler = () => void | Promise<void>;

let activeHandler: TSubpageHandler | null = null;

declare global {
  interface Window {
    __planeCreateSubpage?: () => void;
    __planeRequestCreateSubpage?: () => boolean;
  }
}

export function registerSubpageCreateHandler(handler: TSubpageHandler) {
  activeHandler = handler;
  if (typeof window !== "undefined") {
    window.__planeRequestCreateSubpage = requestCreateSubpage;
  }
  return () => {
    if (activeHandler === handler) activeHandler = null;
  };
}

export function requestCreateSubpage(): boolean {
  if (!activeHandler) return false;
  void activeHandler();
  return true;
}

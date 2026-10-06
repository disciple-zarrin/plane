/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { create } from "axios";
import { isValidRedirectPath } from "@/helpers/authentication.helper";

export abstract class APIService {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = create({
      baseURL,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const isAuthPage =
              !currentPath ||
              currentPath === "/" ||
              currentPath.startsWith("/accounts") ||
              currentPath === "/sign-in" ||
              currentPath === "/sign-up" ||
              currentPath === "/magic-sign-in" ||
              currentPath === "/set-password";

            if (!isAuthPage) {
              const fullPath = currentPath + window.location.search;
              if (isValidRedirectPath(fullPath)) {
                window.location.replace(`/?next_path=${encodeURIComponent(fullPath)}`);
              } else {
                window.location.replace("/");
              }
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  get(url: string, params = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.get(url, {
      ...params,
      ...config,
    });
  }

  post(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.post(url, data, config);
  }

  put(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.put(url, data, config);
  }

  patch(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.patch(url, data, config);
  }

  delete(url: string, data?: any, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  request(config = {}) {
    return this.axiosInstance(config);
  }
}

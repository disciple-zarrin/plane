/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local components
import { CustomEmbedBlock, transformToEmbedUrl } from "./components/block";
import type { CustomEmbedNodeViewProps } from "./components/block";
import { CustomEmbedExtensionConfig } from "./extension-config";
import { EEmbedAttributeNames } from "./types";
import type { CustomEmbedExtensionOptions, CustomEmbedExtensionStorage, TEmbedAttributes } from "./types";

export function CustomEmbedExtension() {
  return CustomEmbedExtensionConfig.extend<CustomEmbedExtensionOptions, CustomEmbedExtensionStorage>({
    addCommands() {
      return {
        insertEmbed:
          (options?: {
            src?: string;
            originalUrl?: string;
            provider?: TEmbedAttributes[EEmbedAttributeNames.PROVIDER];
          }) =>
          ({ commands }) => {
            const embedId = uuidv4();
            let src = options?.src || "";
            let provider = options?.provider || "generic";
            const originalUrl = options?.originalUrl || src;

            if (originalUrl && !src) {
              const transformed = transformToEmbedUrl(originalUrl, provider);
              src = transformed.embedUrl;
              provider = transformed.provider;
            }

            return commands.insertContent({
              type: CORE_EXTENSIONS.CUSTOM_EMBED,
              attrs: {
                [EEmbedAttributeNames.ID]: embedId,
                [EEmbedAttributeNames.SRC]: src,
                [EEmbedAttributeNames.ORIGINAL_URL]: originalUrl,
                [EEmbedAttributeNames.PROVIDER]: provider,
              },
            });
          },
      };
    },

    addNodeView() {
      return ReactNodeViewRenderer((embedProps) => (
        <CustomEmbedBlock {...(embedProps as unknown as CustomEmbedNodeViewProps)} />
      ));
    },
  });
}

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ReactNodeViewRenderer } from "@tiptap/react";
import { v4 as uuidv4 } from "uuid";
// constants
import { ACCEPTED_ATTACHMENT_MIME_TYPES } from "@/constants/config";
// helpers
import { isFileValid } from "@/helpers/file";
import { insertEmptyParagraphAtNodeBoundaries } from "@/helpers/insert-empty-paragraph-at-node-boundary";
// types
import type { TFileHandler } from "@/types";
// local imports
import type { CustomAttachmentNodeViewProps } from "./components/node-view";
import { CustomAttachmentNodeView } from "./components/node-view";
import { CustomAttachmentExtensionConfig } from "./extension-config";
import type { CustomAttachmentExtensionOptions, CustomAttachmentExtensionStorage } from "./types";
import { ECustomAttachmentAttributeNames, ECustomAttachmentStatus } from "./types";
import { getAttachmentComponentFileMap } from "./utils";

type Props = {
  fileHandler: TFileHandler;
  isEditable: boolean;
};

export function CustomAttachmentExtension(props: Props) {
  const { fileHandler, isEditable } = props;
  // derived values
  const { getAssetSrc, getAssetDownloadSrc, restore: restoreAttachmentFn } = fileHandler;

  return CustomAttachmentExtensionConfig.extend<CustomAttachmentExtensionOptions, CustomAttachmentExtensionStorage>({
    selectable: isEditable,
    draggable: isEditable,

    addOptions() {
      const upload = "upload" in fileHandler ? fileHandler.upload : undefined;
      const duplicate = "duplicate" in fileHandler ? fileHandler.duplicate : undefined;
      return {
        ...this.parent?.(),
        getAttachmentDownloadSource: getAssetDownloadSrc,
        getAttachmentSource: getAssetSrc,
        restoreAttachment: restoreAttachmentFn,
        uploadAttachment: upload,
        duplicateAttachment: duplicate,
      };
    },

    addStorage() {
      const maxFileSize = "validation" in fileHandler ? fileHandler.validation?.maxFileSize : 0;

      return {
        fileMap: new Map(),
        deletedAttachmentSet: new Map<string, boolean>(),
        maxFileSize,
      };
    },

    addCommands() {
      return {
        insertAttachmentComponent:
          (props) =>
          ({ commands }) => {
            if (
              props?.file &&
              !isFileValid({
                acceptedMimeTypes: ACCEPTED_ATTACHMENT_MIME_TYPES,
                file: props.file,
                maxFileSize: this.storage.maxFileSize,
                onError: (_error, message) => alert(message),
              })
            ) {
              return false;
            }

            const fileId = uuidv4();

            const fileMap = getAttachmentComponentFileMap(this.editor);

            if (fileMap) {
              if (props?.event === "drop" && props.file) {
                fileMap.set(fileId, {
                  file: props.file,
                  event: props.event,
                });
              } else if (props.event === "insert") {
                fileMap.set(fileId, {
                  event: props.event,
                  hasOpenedFileInputOnce: false,
                });
              }
            }

            const attributes = {
              [ECustomAttachmentAttributeNames.ID]: fileId,
              [ECustomAttachmentAttributeNames.ORIGINAL_NAME]: props.file?.name ?? null,
              [ECustomAttachmentAttributeNames.SIZE]: props.file?.size ?? null,
              [ECustomAttachmentAttributeNames.STATUS]: ECustomAttachmentStatus.PENDING,
            };

            if (props.pos) {
              return commands.insertContentAt(props.pos, {
                type: this.name,
                attrs: attributes,
              });
            }
            return commands.insertContent({
              type: this.name,
              attrs: attributes,
            });
          },
      };
    },

    addKeyboardShortcuts() {
      return {
        ArrowDown: insertEmptyParagraphAtNodeBoundaries("down", this.name),
        ArrowUp: insertEmptyParagraphAtNodeBoundaries("up", this.name),
      };
    },
    addNodeView() {
      return ReactNodeViewRenderer((props) => (
        <CustomAttachmentNodeView {...props} node={props.node as CustomAttachmentNodeViewProps["node"]} />
      ));
    },
  });
}

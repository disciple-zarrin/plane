/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
// local imports
import type { CustomAttachmentExtensionType, TCustomAttachmentAttributes } from "../types";
import { ECustomAttachmentAttributeNames, ECustomAttachmentStatus } from "../types";
import { hasAttachmentDuplicationFailed } from "../utils";
import { CustomAttachmentBlock } from "./block";
import { CustomAttachmentUploader } from "./uploader";

export type CustomAttachmentNodeViewProps = Omit<NodeViewProps, "extension" | "updateAttributes"> & {
  extension: CustomAttachmentExtensionType;
  node: NodeViewProps["node"] & {
    attrs: TCustomAttachmentAttributes;
  };
  updateAttributes: (attrs: Partial<TCustomAttachmentAttributes>) => void;
};

export function CustomAttachmentNodeView(props: CustomAttachmentNodeViewProps) {
  const { editor, extension, node, updateAttributes } = props;
  const { src: attachmentNodeSrc, status } = node.attrs;

  const [isUploaded, setIsUploaded] = useState(!!attachmentNodeSrc);
  const [resolvedDownloadSrc, setResolvedDownloadSrc] = useState<string | undefined>(undefined);
  const [failedToLoadAttachment, setFailedToLoadAttachment] = useState(false);

  const hasRetriedOnMount = useRef(false);
  const isDuplicatingRef = useRef(false);

  useEffect(() => {
    if (attachmentNodeSrc) {
      setIsUploaded(true);
    } else {
      setIsUploaded(false);
    }
  }, [attachmentNodeSrc]);

  useEffect(() => {
    if (!attachmentNodeSrc) {
      setResolvedDownloadSrc(undefined);
      return;
    }

    setResolvedDownloadSrc(undefined);
    setFailedToLoadAttachment(false);

    const getAttachmentSource = async () => {
      try {
        const downloadUrl = await extension.options.getAttachmentDownloadSource?.(attachmentNodeSrc);
        setResolvedDownloadSrc(downloadUrl);
      } catch (error) {
        console.error("Error fetching attachment source:", error);
        setFailedToLoadAttachment(true);
      }
    };
    void getAttachmentSource();
  }, [attachmentNodeSrc, extension.options.getAttachmentDownloadSource]);

  useEffect(() => {
    const handleDuplication = async () => {
      if (
        status !== ECustomAttachmentStatus.DUPLICATING ||
        !extension.options.duplicateAttachment ||
        !attachmentNodeSrc
      ) {
        return;
      }

      if (isDuplicatingRef.current) {
        return;
      }

      isDuplicatingRef.current = true;
      try {
        hasRetriedOnMount.current = true;
        const newAssetId = await extension.options.duplicateAttachment(attachmentNodeSrc);

        if (!newAssetId) {
          throw new Error("Duplication returned invalid asset ID");
        }

        setFailedToLoadAttachment(false);
        updateAttributes({ src: newAssetId, status: ECustomAttachmentStatus.UPLOADED });
      } catch (error: unknown) {
        console.error("Failed to duplicate attachment:", error);
        updateAttributes({ status: ECustomAttachmentStatus.DUPLICATION_FAILED });
      } finally {
        isDuplicatingRef.current = false;
      }
    };

    void handleDuplication();
  }, [status, attachmentNodeSrc, extension.options.duplicateAttachment, updateAttributes]);

  useEffect(() => {
    if (hasAttachmentDuplicationFailed(status) && !hasRetriedOnMount.current && attachmentNodeSrc) {
      hasRetriedOnMount.current = true;
      updateAttributes({ status: ECustomAttachmentStatus.DUPLICATING });
    }
  }, [status, attachmentNodeSrc, updateAttributes]);

  useEffect(() => {
    if (status === ECustomAttachmentStatus.UPLOADED) {
      hasRetriedOnMount.current = false;
      setFailedToLoadAttachment(false);
    }
  }, [status]);

  const hasDuplicationFailed = hasAttachmentDuplicationFailed(status);
  const shouldShowBlock = isUploaded && !failedToLoadAttachment && !hasDuplicationFailed;

  return (
    <NodeViewWrapper key={node.attrs[ECustomAttachmentAttributeNames.ID]}>
      <div
        className="mx-0 my-2 p-0"
        data-drag-handle
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {shouldShowBlock && !hasDuplicationFailed ? (
          <CustomAttachmentBlock downloadSrc={resolvedDownloadSrc} {...props} />
        ) : (
          <CustomAttachmentUploader
            failedToLoadAttachment={failedToLoadAttachment}
            hasDuplicationFailed={hasDuplicationFailed}
            maxFileSize={(editor.storage.attachmentComponent as { maxFileSize?: number } | undefined)?.maxFileSize ?? 0}
            setIsUploaded={setIsUploaded}
            {...props}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
}

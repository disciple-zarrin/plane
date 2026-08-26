/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useMemo } from "react";
// local imports
import { getFileCategory } from "../helpers/file-category";
import type { CustomAttachmentNodeViewProps } from "./node-view";
import { VideoPlayerBlock } from "./renderers/video-player-block";
import { AudioPlayerBlock } from "./renderers/audio-player-block";
import { PDFBlock } from "./renderers/pdf-block";
import { FileCardBlock } from "./renderers/file-card-block";

interface CustomAttachmentBlockProps extends CustomAttachmentNodeViewProps {
  downloadSrc: string | undefined;
}

export function CustomAttachmentBlock(props: CustomAttachmentBlockProps) {
  const { node } = props;
  const { originalName } = node.attrs;

  const category = useMemo(() => getFileCategory(originalName), [originalName]);

  switch (category) {
    case "video":
      return <VideoPlayerBlock {...props} />;
    case "audio":
      return <AudioPlayerBlock {...props} />;
    case "pdf":
      return <PDFBlock {...props} />;
    default:
      return <FileCardBlock {...props} />;
  }
}

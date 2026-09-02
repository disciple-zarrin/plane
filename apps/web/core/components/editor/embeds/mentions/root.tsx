/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { EditorUserMention } from "./user";
import { EditorPageMention } from "./page";
import type { TCallbackMentionComponentProps } from "@plane/editor";

export function EditorMentionsRoot(props: TCallbackMentionComponentProps) {
  const { entity_identifier, entity_name } = props;

  switch (entity_name as string) {
    case "user_mention":
      return <EditorUserMention id={entity_identifier} />;
    case "page_mention":
    case "page":
      return <EditorPageMention id={entity_identifier} />;
    default:
      return null;
  }
}

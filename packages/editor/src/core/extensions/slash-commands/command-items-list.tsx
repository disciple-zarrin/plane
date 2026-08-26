/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  ALargeSmall,
  CaseSensitive,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  ImageIcon,
  List,
  ListOrdered,
  ListTodo,
  MessageSquareText,
  MinusSquare,
  Smile,
  Table,
  TextQuote,
  FileIcon,
  FileVideo,
  FileAudio,
  FileText,
  Bookmark,
  ChevronRight,
  ListTree,
  Sigma,
  Columns2,
  Columns3,
  FolderTree,
  Calendar,
  Clock,
  Lightbulb,
  AlertTriangle,
  AlertOctagon,
  Info,
  StickyNote,
  Palette,
  HelpCircle,
  Globe,
  Play,
  Figma,
  Code,
} from "lucide-react";
// constants
import { COLORS_LIST } from "@/constants/common";
// helpers
import {
  insertTableCommand,
  toggleBlockquote,
  toggleBulletList,
  toggleOrderedList,
  toggleTaskList,
  toggleHeading,
  toggleTextColor,
  toggleBackgroundColor,
  insertImage,
  insertCallout,
  setText,
  openEmojiPicker,
} from "@/helpers/editor-commands";
// plane editor extensions
import { coreEditorAdditionalSlashCommandOptions } from "@/plane-editor/extensions";
// types
import type { CommandProps, ISlashCommandItem, TSlashCommandSectionKeys } from "@/types";
// local types
import type { TExtensionProps, TSlashCommandAdditionalOption } from "./root";

export type TSlashCommandSection = {
  key: TSlashCommandSectionKeys;
  title?: string;
  items: ISlashCommandItem[];
};

export const getSlashCommandFilteredSections =
  (args: TExtensionProps) =>
  ({ query }: { query: string }): TSlashCommandSection[] => {
    const { additionalOptions: externalAdditionalOptions, disabledExtensions, flaggedExtensions, extendedEditorProps } = args;
    const SLASH_COMMAND_SECTIONS: TSlashCommandSection[] = [
      {
        key: "general",
        items: [
          {
            commandKey: "text",
            key: "text",
            title: "Text",
            description: "Just start typing with plain text.",
            searchTerms: ["p", "paragraph"],
            icon: <CaseSensitive className="size-3.5" />,
            command: ({ editor, range }) => setText(editor, range),
          },
          {
            commandKey: "h1",
            key: "h1",
            title: "Heading 1",
            description: "Big section heading.",
            searchTerms: ["title", "big", "large"],
            icon: <Heading1 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 1, range),
          },
          {
            commandKey: "h2",
            key: "h2",
            title: "Heading 2",
            description: "Medium section heading.",
            searchTerms: ["subtitle", "medium"],
            icon: <Heading2 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 2, range),
          },
          {
            commandKey: "h3",
            key: "h3",
            title: "Heading 3",
            description: "Small section heading.",
            searchTerms: ["subtitle", "small"],
            icon: <Heading3 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 3, range),
          },
          {
            commandKey: "h4",
            key: "h4",
            title: "Heading 4",
            description: "Small section heading.",
            searchTerms: ["subtitle", "small"],
            icon: <Heading4 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 4, range),
          },
          {
            commandKey: "h5",
            key: "h5",
            title: "Heading 5",
            description: "Small section heading.",
            searchTerms: ["subtitle", "small"],
            icon: <Heading5 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 5, range),
          },
          {
            commandKey: "h6",
            key: "h6",
            title: "Heading 6",
            description: "Small section heading.",
            searchTerms: ["subtitle", "small"],
            icon: <Heading6 className="size-3.5" />,
            command: ({ editor, range }) => toggleHeading(editor, 6, range),
          },

          {
            commandKey: "numbered-list",
            key: "numbered-list",
            title: "Numbered list",
            description: "Create a numbered list.",
            searchTerms: ["ordered"],
            icon: <ListOrdered className="size-3.5" />,
            command: ({ editor, range }) => toggleOrderedList(editor, range),
          },
          {
            commandKey: "bulleted-list",
            key: "bulleted-list",
            title: "Bulleted list",
            description: "Create a bulleted list.",
            searchTerms: ["unordered", "point"],
            icon: <List className="size-3.5" />,
            command: ({ editor, range }) => toggleBulletList(editor, range),
          },
          {
            commandKey: "to-do-list",
            key: "to-do-list",
            title: "To-do list",
            description: "Create a to-do list.",
            searchTerms: ["todo", "task", "list", "check", "checkbox"],
            icon: <ListTodo className="size-3.5" />,
            command: ({ editor, range }) => toggleTaskList(editor, range),
          },
          {
            commandKey: "table",
            key: "table",
            title: "Table",
            description: "Create a table",
            searchTerms: ["table", "cell", "db", "data", "tabular"],
            icon: <Table className="size-3.5" />,
            command: ({ editor, range }) => insertTableCommand(editor, range),
          },
          {
            commandKey: "quote",
            key: "quote",
            title: "Quote",
            description: "Capture a quote.",
            searchTerms: ["blockquote"],
            icon: <TextQuote className="size-3.5" />,
            command: ({ editor, range }) => toggleBlockquote(editor, range),
          },
          {
            commandKey: "code",
            key: "code",
            title: "Code",
            description: "Capture a code snippet.",
            searchTerms: ["codeblock"],
            icon: <Code2 className="size-3.5" />,
            command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
          },
          {
            commandKey: "callout",
            key: "callout",
            title: "Callout",
            icon: <MessageSquareText className="size-3.5" />,
            description: "Insert callout",
            searchTerms: ["callout", "comment", "message", "info", "alert"],
            command: ({ editor, range }: CommandProps) => insertCallout(editor, range),
          },
          {
            commandKey: "divider",
            key: "divider",
            title: "Divider",
            description: "Visually divide blocks.",
            searchTerms: ["line", "divider", "horizontal", "rule", "separate"],
            icon: <MinusSquare className="size-3.5" />,
            command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
          },
          {
            commandKey: "emoji",
            key: "emoji",
            title: "Emoji",
            description: "Insert an emoji",
            searchTerms: ["emoji", "icons", "reaction", "emoticon", "emotags"],
            icon: <Smile className="size-3.5" />,
            command: ({ editor, range }) => {
              openEmojiPicker(editor, range);
            },
          },
        ],
      },
      {
        key: "text-colors",
        title: "Colors",
        items: [
          {
            commandKey: "text-color",
            key: "text-color-default",
            title: "Default",
            description: "Change text color",
            searchTerms: ["color", "text", "default"],
            icon: <ALargeSmall className="size-3.5 text-primary" />,
            command: ({ editor, range }) => toggleTextColor(undefined, editor, range),
          },
          ...COLORS_LIST.map(
            (color) =>
              ({
                commandKey: "text-color",
                key: `text-color-${color.key}`,
                title: color.label,
                description: "Change text color",
                searchTerms: ["color", "text", color.label],

                icon: (
                  <ALargeSmall
                    className="size-3.5"
                    style={{
                      color: color.textColor,
                    }}
                  />
                ),

                command: ({ editor, range }) => toggleTextColor(color.key, editor, range),
              }) as ISlashCommandItem
          ),
        ],
      },
      {
        key: "background-colors",
        title: "Background colors",
        items: [
          {
            commandKey: "background-color",
            key: "background-color-default",
            title: "Default background",
            description: "Change background color",
            searchTerms: ["color", "bg", "background", "default"],
            icon: <ALargeSmall className="size-3.5" />,
            iconContainerStyle: {
              borderRadius: "4px",
              backgroundColor: "var(--background-color-surface-1)",
              border: "1px solid var(--border-color-strong)",
            },
            command: ({ editor, range }) => toggleTextColor(undefined, editor, range),
          },
          ...COLORS_LIST.map(
            (color) =>
              ({
                commandKey: "background-color",
                key: `background-color-${color.key}`,
                title: color.label,
                description: "Change background color",
                searchTerms: ["color", "bg", "background", color.label],
                icon: <ALargeSmall className="size-3.5" />,

                iconContainerStyle: {
                  borderRadius: "4px",
                  backgroundColor: color.backgroundColor,
                },

                command: ({ editor, range }) => toggleBackgroundColor(color.key, editor, range),
              }) as ISlashCommandItem
          ),
        ],
      },
    ];

    const internalAdditionalOptions: TSlashCommandAdditionalOption[] = [];
    if (!disabledExtensions?.includes("image")) {
      internalAdditionalOptions.push({
        commandKey: "image",
        key: "image",
        title: "Image",
        icon: <ImageIcon className="size-3.5" />,
        description: "Insert an image",
        searchTerms: ["img", "photo", "picture", "media", "upload"],
        command: ({ editor, range }: CommandProps) => insertImage({ editor, event: "insert", range }),
        section: "general",
        pushAfter: "code",
      });
    }

    internalAdditionalOptions.push(
      {
        commandKey: "video",
        key: "video",
        title: "Video",
        icon: <FileVideo className="size-3.5" />,
        description: "Upload or embed a video",
        searchTerms: ["video", "mp4", "movie", "clip", "media", "film"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertAttachmentComponent({ event: "insert" });
        },
        section: "general",
        pushAfter: "image",
      },
      {
        commandKey: "audio",
        key: "audio",
        title: "Audio",
        icon: <FileAudio className="size-3.5" />,
        description: "Upload or embed an audio track",
        searchTerms: ["audio", "music", "sound", "mp3", "voice", "recording"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertAttachmentComponent({ event: "insert" });
        },
        section: "general",
        pushAfter: "video",
      },
      {
        commandKey: "pdf",
        key: "pdf",
        title: "PDF Document",
        icon: <FileText className="size-3.5" />,
        description: "Upload a PDF document",
        searchTerms: ["pdf", "document", "doc", "paper"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertAttachmentComponent({ event: "insert" });
        },
        section: "general",
        pushAfter: "audio",
      },
      {
        commandKey: "file",
        key: "file",
        title: "File",
        icon: <FileIcon className="size-3.5" />,
        description: "Upload any document or file",
        searchTerms: ["file", "attachment", "upload", "doc", "zip", "archive"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertAttachmentComponent({ event: "insert" });
        },
        section: "general",
        pushAfter: "pdf",
      },
      {
        commandKey: "bookmark",
        key: "bookmark",
        title: "Web Bookmark",
        icon: <Bookmark className="size-3.5" />,
        description: "Insert a Notion-style web bookmark card",
        searchTerms: ["bookmark", "link", "url", "web", "preview"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertBookmarkComponent({});
        },
        section: "general",
        pushAfter: "file",
      },
      {
        commandKey: "toggle",
        key: "toggle",
        title: "Toggle List",
        icon: <ChevronRight className="size-3.5" />,
        description: "Toggles can show and hide content",
        searchTerms: ["toggle", "collapsible", "dropdown", "accordion", "hide", "show"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertToggle();
        },
        section: "general",
        pushAfter: "bookmark",
      },
      {
        commandKey: "table-of-contents",
        key: "table-of-contents",
        title: "Table of Contents",
        icon: <ListTree className="size-3.5" />,
        description: "Insert a dynamic outline of page headings",
        searchTerms: ["toc", "table of contents", "outline", "headings", "index"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertTableOfContents();
        },
        section: "general",
        pushAfter: "toggle",
      },
      {
        commandKey: "math",
        key: "math",
        title: "Math / Equation",
        icon: <Sigma className="size-3.5" />,
        description: "Insert a LaTeX mathematical equation block",
        searchTerms: ["math", "equation", "latex", "formula", "algebra", "calculate"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertMath({ latex: "E = mc^2" });
        },
        section: "general",
        pushAfter: "table-of-contents",
      },
      {
        commandKey: "2columns",
        key: "2columns",
        title: "2 Columns",
        icon: <Columns2 className="size-3.5" />,
        description: "Split layout into 2 side-by-side columns",
        searchTerms: ["columns", "2 columns", "split", "grid", "side by side", "two"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertColumns({ count: 2 });
        },
        section: "general",
        pushAfter: "math",
      },
      {
        commandKey: "3columns",
        key: "3columns",
        title: "3 Columns",
        icon: <Columns3 className="size-3.5" />,
        description: "Split layout into 3 side-by-side columns",
        searchTerms: ["columns", "3 columns", "split", "grid", "three"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertColumns({ count: 3 });
        },
        section: "general",
        pushAfter: "2columns",
      },
      {
        commandKey: "breadcrumb",
        key: "breadcrumb",
        title: "Breadcrumbs",
        icon: <FolderTree className="size-3.5" />,
        description: "Insert a document hierarchy breadcrumb path",
        searchTerms: ["breadcrumb", "path", "hierarchy", "navigation", "trail"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertBreadcrumb();
        },
        section: "general",
        pushAfter: "3columns",
      },
      {
        commandKey: "page-link",
        key: "page-link",
        title: "Link to Page",
        icon: <FileText className="size-3.5" />,
        description: "Insert a stylized link card to another page",
        searchTerms: ["page", "link", "subpage", "document", "navigate"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertPageLink({});
        },
        section: "general",
        pushAfter: "breadcrumb",
      },
      {
        commandKey: "today",
        key: "today",
        title: "Today's Date",
        icon: <Calendar className="size-3.5" />,
        description: "Insert today's date badge",
        searchTerms: ["today", "date", "calendar", "emrooz"],
        command: ({ editor, range }: CommandProps) => {
          const now = new Date();
          const formatted = now.toLocaleDateString("fa-IR");
          editor.chain().focus().deleteRange(range).insertContent(`📅 ${formatted} `).run();
        },
        section: "general",
        pushAfter: "page-link",
      },
      {
        commandKey: "now",
        key: "now",
        title: "Current Date & Time",
        icon: <Clock className="size-3.5" />,
        description: "Insert current date and time",
        searchTerms: ["now", "time", "clock", "alan", "saat"],
        command: ({ editor, range }: CommandProps) => {
          const now = new Date();
          const formatted = `${now.toLocaleDateString("fa-IR")} - ${now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}`;
          editor.chain().focus().deleteRange(range).insertContent(`🕒 ${formatted} `).run();
        },
        section: "general",
        pushAfter: "today",
      },
      {
        commandKey: "date",
        key: "date",
        title: "Date (English)",
        icon: <Calendar className="size-3.5" />,
        description: "Insert English formatted date",
        searchTerms: ["date", "english date", "en"],
        command: ({ editor, range }: CommandProps) => {
          const now = new Date();
          const formatted = now.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
          editor.chain().focus().deleteRange(range).insertContent(`📅 ${formatted} `).run();
        },
        section: "general",
        pushAfter: "now",
      },
      // Callout Presets
      {
        commandKey: "tip",
        key: "tip",
        title: "Tip / نکته",
        icon: <Lightbulb className="size-3.5 text-emerald-500" />,
        description: "Insert a green Tip callout with lightbulb",
        searchTerms: ["tip", "hint", "idea", "lightbulb", "nokteh"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: CORE_EXTENSIONS.CALLOUT,
            content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            attrs: {
              "data-logo-in-use": "emoji",
              "data-emoji-unicode": "1f4a1",
              "data-background": "rgb(236, 253, 245)",
            },
          }).run();
        },
        section: "general",
        pushAfter: "date",
      },
      {
        commandKey: "warning",
        key: "warning",
        title: "Warning / هشدار",
        icon: <AlertTriangle className="size-3.5 text-amber-500" />,
        description: "Insert a yellow Warning callout",
        searchTerms: ["warning", "alert", "caution", "heed", "tahzir", "hoshdar"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: CORE_EXTENSIONS.CALLOUT,
            content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            attrs: {
              "data-logo-in-use": "emoji",
              "data-emoji-unicode": "26a0-fe0f",
              "data-background": "rgb(254, 243, 199)",
            },
          }).run();
        },
        section: "general",
        pushAfter: "tip",
      },
      {
        commandKey: "danger",
        key: "danger",
        title: "Danger / خطا",
        icon: <AlertOctagon className="size-3.5 text-red-500" />,
        description: "Insert a red Danger/Error callout",
        searchTerms: ["danger", "error", "critical", "stop", "khatar"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: CORE_EXTENSIONS.CALLOUT,
            content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            attrs: {
              "data-logo-in-use": "emoji",
              "data-emoji-unicode": "26d4",
              "data-background": "rgb(254, 226, 226)",
            },
          }).run();
        },
        section: "general",
        pushAfter: "warning",
      },
      {
        commandKey: "info",
        key: "info",
        title: "Info / اطلاعات",
        icon: <Info className="size-3.5 text-blue-500" />,
        description: "Insert a blue Information callout",
        searchTerms: ["info", "information", "note", "rahnama"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: CORE_EXTENSIONS.CALLOUT,
            content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            attrs: {
              "data-logo-in-use": "emoji",
              "data-emoji-unicode": "2139-fe0f",
              "data-background": "rgb(239, 246, 255)",
            },
          }).run();
        },
        section: "general",
        pushAfter: "danger",
      },
      {
        commandKey: "note",
        key: "note",
        title: "Note / یادداشت",
        icon: <StickyNote className="size-3.5 text-purple-500" />,
        description: "Insert a purple Note callout",
        searchTerms: ["note", "memo", "yaddasht"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: CORE_EXTENSIONS.CALLOUT,
            content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            attrs: {
              "data-logo-in-use": "emoji",
              "data-emoji-unicode": "1f4dd",
              "data-background": "rgb(245, 243, 255)",
            },
          }).run();
        },
        section: "general",
        pushAfter: "info",
      },
      // Colors
      {
        commandKey: "color-red",
        key: "color-red",
        title: "Red Color",
        icon: <Palette className="size-3.5 text-red-500" />,
        description: "Apply red text/background color",
        searchTerms: ["red", "color", "ghermez", "rang"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setCustomColor({
            textColor: "var(--editor-colors-pink-text)",
            backgroundColor: "var(--editor-colors-pink-background)",
          }).run();
        },
        section: "general",
        pushAfter: "note",
      },
      {
        commandKey: "color-green",
        key: "color-green",
        title: "Green Color",
        icon: <Palette className="size-3.5 text-green-500" />,
        description: "Apply green text/background color",
        searchTerms: ["green", "color", "sabz"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setCustomColor({
            textColor: "var(--editor-colors-green-text)",
            backgroundColor: "var(--editor-colors-green-background)",
          }).run();
        },
        section: "general",
        pushAfter: "color-red",
      },
      {
        commandKey: "color-blue",
        key: "color-blue",
        title: "Blue Color",
        icon: <Palette className="size-3.5 text-blue-500" />,
        description: "Apply blue text/background color",
        searchTerms: ["blue", "color", "abi"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setCustomColor({
            textColor: "var(--editor-colors-light-blue-text)",
            backgroundColor: "var(--editor-colors-light-blue-background)",
          }).run();
        },
        section: "general",
        pushAfter: "color-green",
      },
      {
        commandKey: "color-yellow",
        key: "color-yellow",
        title: "Yellow / Peach Color",
        icon: <Palette className="size-3.5 text-amber-500" />,
        description: "Apply yellow text/background color",
        searchTerms: ["yellow", "peach", "color", "zard"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setCustomColor({
            textColor: "var(--editor-colors-peach-text)",
            backgroundColor: "var(--editor-colors-peach-background)",
          }).run();
        },
        section: "general",
        pushAfter: "color-blue",
      },
      {
        commandKey: "color-purple",
        key: "color-purple",
        title: "Purple Color",
        icon: <Palette className="size-3.5 text-purple-500" />,
        description: "Apply purple text/background color",
        searchTerms: ["purple", "color", "banafshe"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setCustomColor({
            textColor: "var(--editor-colors-purple-text)",
            backgroundColor: "var(--editor-colors-purple-background)",
          }).run();
        },
        section: "general",
        pushAfter: "color-yellow",
      },
      {
        commandKey: "color-orange",
        key: "color-orange",
        title: "Orange Color",
        icon: <Palette className="size-3.5 text-orange-500" />,
        description: "Apply orange text/background color",
        searchTerms: ["orange", "color", "narenji"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setCustomColor({
            textColor: "var(--editor-colors-orange-text)",
            backgroundColor: "var(--editor-colors-orange-background)",
          }).run();
        },
        section: "general",
        pushAfter: "color-purple",
      },
      {
        commandKey: "color-gray",
        key: "color-gray",
        title: "Gray Color",
        icon: <Palette className="size-3.5 text-gray-500" />,
        description: "Apply gray text/background color",
        searchTerms: ["gray", "grey", "color", "toosi"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setCustomColor({
            textColor: "var(--editor-colors-gray-text)",
            backgroundColor: "var(--editor-colors-gray-background)",
          }).run();
        },
        section: "general",
        pushAfter: "color-orange",
      },
      {
        commandKey: "shortcuts",
        key: "shortcuts",
        title: "Shortcuts / راهنمای میانبرها",
        icon: <HelpCircle className="size-3.5 text-accent-primary" />,
        description: "View quick Markdown & editor keyboard shortcuts",
        searchTerms: ["shortcuts", "help", "guide", "hotkeys", "mianbor", "rahnama"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(
            `> 💡 **راهنمای میانبرهای سریع مارک‌داون:**\n> * \`#\` برای تیتر ۱ | \`##\` برای تیتر ۲ | \`###\` برای تیتر ۳\n> * \`-\` یا \`*\` برای لیست نقطه‌ای | \`1.\` برای لیست عددی | \`[]\` برای چک‌لیست\n> * \`>\` برای نقل‌قول | \`\`\` برای کادر کد | \`/\` برای تمام دستورات اسلش\n`
          ).run();
        },
        section: "general",
        pushAfter: "color-gray",
      },
      // Interactive Embeds
      {
        commandKey: "embed",
        key: "embed",
        title: "Web Embed / جاسازی وب",
        icon: <Globe className="size-3.5 text-accent-primary" />,
        description: "Embed interactive website, form, or web app via iframe",
        searchTerms: ["embed", "iframe", "web", "jasazi", "site"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "generic" });
        },
        section: "general",
        pushAfter: "shortcuts",
      },
      {
        commandKey: "youtube",
        key: "youtube",
        title: "YouTube Video",
        icon: <Play className="size-3.5 text-red-500" />,
        description: "Embed an interactive YouTube video player",
        searchTerms: ["youtube", "video", "yt", "stream"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "youtube" });
        },
        section: "general",
        pushAfter: "embed",
      },
      {
        commandKey: "aparat",
        key: "aparat",
        title: "Aparat Video / آپارات",
        icon: <Play className="size-3.5 text-pink-500" />,
        description: "Embed an Aparat video player",
        searchTerms: ["aparat", "video", "clip", "aparat video"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "aparat" });
        },
        section: "general",
        pushAfter: "youtube",
      },
      {
        commandKey: "figma",
        key: "figma",
        title: "Figma Prototype",
        icon: <Figma className="size-3.5 text-purple-500" />,
        description: "Embed a live Figma frame or prototype",
        searchTerms: ["figma", "design", "ui", "ux", "prototype"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "figma" });
        },
        section: "general",
        pushAfter: "aparat",
      },
      {
        commandKey: "codepen",
        key: "codepen",
        title: "CodePen Snippet",
        icon: <Code className="size-3.5 text-teal-500" />,
        description: "Embed an interactive CodePen demo",
        searchTerms: ["codepen", "code", "html", "css", "js", "demo"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "codepen" });
        },
        section: "general",
        pushAfter: "figma",
      }
    );

    [
      ...internalAdditionalOptions,
      ...(externalAdditionalOptions ?? []),
      ...coreEditorAdditionalSlashCommandOptions({
        disabledExtensions,
        flaggedExtensions,
        extendedEditorProps,
      }),
    ]?.forEach((item) => {
      const sectionToPushTo = SLASH_COMMAND_SECTIONS.find((s) => s.key === item.section) ?? SLASH_COMMAND_SECTIONS[0];
      const itemIndexToPushAfter = sectionToPushTo.items.findIndex((i) => i.commandKey === item.pushAfter);
      if (itemIndexToPushAfter !== -1) {
        sectionToPushTo.items.splice(itemIndexToPushAfter + 1, 0, item);
      } else {
        sectionToPushTo.items.push(item);
      }
    });

    const filteredSlashSections = SLASH_COMMAND_SECTIONS.map((section) =>
      Object.assign({}, section, {
        items: section.items.filter((item) => {
          if (typeof query !== "string") return;

          const lowercaseQuery = query.toLowerCase();
          return (
            item.title.toLowerCase().includes(lowercaseQuery) ||
            item.description.toLowerCase().includes(lowercaseQuery) ||
            item.searchTerms.some((t) => t.includes(lowercaseQuery))
          );
        }),
      })
    );

    return filteredSlashSections.filter((s) => s.items.length !== 0);
  };

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
  Database,
  GitFork,
  Music,
  Copy,
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Tag,
  Users,
  Bug,
  Star,
  Flame,
} from "lucide-react";
// constants
import { COLORS_LIST } from "@/constants/common";
import { CORE_EXTENSIONS } from "@/constants/extension";
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
        title: "بلوک‌های پایه (Basic Blocks)",
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
        key: "structure",
        title: "ساختار و چیدمان (Structure & Layout)",
        items: [],
      },
      {
        key: "media",
        title: "رسانه و فایل‌ها (Media & Files)",
        items: [],
      },
      {
        key: "embeds",
        title: "جاسازی و وب (Embeds & Web)",
        items: [],
      },
      {
        key: "templates",
        title: "قالب‌ها و تاریخ‌ها (Templates & Dates)",
        items: [],
      },
      {
        key: "badges",
        title: "وضعیت و اولویت (Status & Badges)",
        items: [],
      },
      {
        key: "highlights",
        title: "کالبوت‌ها و هایلایت‌ها (Callouts & Highlights)",
        items: [],
      },
      {
        key: "text-colors",
        title: "Colors",
        items: [
          {
            commandKey: "text-color-default",
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
                commandKey: `text-color-${color.key}`,
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
            commandKey: "background-color-default",
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
            command: ({ editor, range }) => toggleBackgroundColor(undefined, editor, range),
          },
          ...COLORS_LIST.map(
            (color) =>
              ({
                commandKey: `background-color-${color.key}`,
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
        section: "media",
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
        section: "media",
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
        section: "media",
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
        section: "media",
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
        section: "media",
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
        section: "media",
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
          editor.commands.insertToggle({});
        },
        section: "structure",
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
        section: "structure",
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
        section: "structure",
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
        section: "structure",
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
        section: "structure",
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
        section: "structure",
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
        section: "structure",
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
        section: "templates",
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
        section: "templates",
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
        section: "templates",
        pushAfter: "now",
      },
      // Callout Presets
      {
        commandKey: "tip",
        key: "tip",
        title: "Tip / نکته",
        icon: <Lightbulb className="text-emerald-500 size-3.5" />,
        description: "Insert a green Tip callout with lightbulb",
        searchTerms: ["tip", "hint", "idea", "lightbulb", "nokteh"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "1f4a1",
                "data-background": "rgb(236, 253, 245)",
                "data-block-type": "callout-component",
              },
            })
            .run();
        },
        section: "highlights",
        pushAfter: "date",
      },
      {
        commandKey: "warning",
        key: "warning",
        title: "Warning / هشدار",
        icon: <AlertTriangle className="text-amber-500 size-3.5" />,
        description: "Insert a yellow Warning callout",
        searchTerms: ["warning", "alert", "caution", "heed", "tahzir", "hoshdar"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "26a0-fe0f",
                "data-background": "rgb(254, 243, 199)",
                "data-block-type": "callout-component",
              },
            })
            .run();
        },
        section: "highlights",
        pushAfter: "tip",
      },
      {
        commandKey: "danger",
        key: "danger",
        title: "Danger / خطا",
        icon: <AlertOctagon className="text-red-500 size-3.5" />,
        description: "Insert a red Danger/Error callout",
        searchTerms: ["danger", "error", "critical", "stop", "khatar"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "26d4",
                "data-background": "rgb(254, 226, 226)",
                "data-block-type": "callout-component",
              },
            })
            .run();
        },
        section: "highlights",
        pushAfter: "warning",
      },
      {
        commandKey: "info",
        key: "info",
        title: "Info / اطلاعات",
        icon: <Info className="text-blue-500 size-3.5" />,
        description: "Insert a blue Information callout",
        searchTerms: ["info", "information", "note", "rahnama"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "2139-fe0f",
                "data-background": "rgb(239, 246, 255)",
                "data-block-type": "callout-component",
              },
            })
            .run();
        },
        section: "highlights",
        pushAfter: "danger",
      },
      {
        commandKey: "note",
        key: "note",
        title: "Note / یادداشت",
        icon: <StickyNote className="text-purple-500 size-3.5" />,
        description: "Insert a purple Note callout",
        searchTerms: ["note", "memo", "yaddasht"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "1f4dd",
                "data-background": "rgb(245, 243, 255)",
                "data-block-type": "callout-component",
              },
            })
            .run();
        },
        section: "highlights",
        pushAfter: "info",
      },
      // Colors
      {
        commandKey: "color-red",
        key: "color-red",
        title: "Red Color",
        icon: <Palette className="text-red-500 size-3.5" />,
        description: "Apply red text color",
        searchTerms: ["red", "color", "ghermez", "rang"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setTextColor("var(--editor-colors-pink-text)").run();
        },
        section: "highlights",
        pushAfter: "note",
      },
      {
        commandKey: "color-green",
        key: "color-green",
        title: "Green Color",
        icon: <Palette className="text-green-500 size-3.5" />,
        description: "Apply green text color",
        searchTerms: ["green", "color", "sabz"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setTextColor("var(--editor-colors-green-text)").run();
        },
        section: "highlights",
        pushAfter: "color-red",
      },
      {
        commandKey: "color-blue",
        key: "color-blue",
        title: "Blue Color",
        icon: <Palette className="text-blue-500 size-3.5" />,
        description: "Apply blue text color",
        searchTerms: ["blue", "color", "abi"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setTextColor("var(--editor-colors-light-blue-text)").run();
        },
        section: "highlights",
        pushAfter: "color-green",
      },
      {
        commandKey: "color-yellow",
        key: "color-yellow",
        title: "Yellow / Peach Color",
        icon: <Palette className="text-amber-500 size-3.5" />,
        description: "Apply yellow text color",
        searchTerms: ["yellow", "peach", "color", "zard"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setTextColor("var(--editor-colors-peach-text)").run();
        },
        section: "highlights",
        pushAfter: "color-blue",
      },
      {
        commandKey: "color-purple",
        key: "color-purple",
        title: "Purple Color",
        icon: <Palette className="text-purple-500 size-3.5" />,
        description: "Apply purple text color",
        searchTerms: ["purple", "color", "banafshe"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setTextColor("var(--editor-colors-purple-text)").run();
        },
        section: "highlights",
        pushAfter: "color-yellow",
      },
      {
        commandKey: "color-orange",
        key: "color-orange",
        title: "Orange Color",
        icon: <Palette className="text-orange-500 size-3.5" />,
        description: "Apply orange text color",
        searchTerms: ["orange", "color", "narenji"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setTextColor("var(--editor-colors-orange-text)").run();
        },
        section: "highlights",
        pushAfter: "color-purple",
      },
      {
        commandKey: "color-gray",
        key: "color-gray",
        title: "Gray Color",
        icon: <Palette className="text-gray-500 size-3.5" />,
        description: "Apply gray text color",
        searchTerms: ["gray", "grey", "color", "toosi"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setTextColor("var(--editor-colors-gray-text)").run();
        },
        section: "highlights",
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
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "1f4a1",
                "data-background": "rgb(236, 253, 245)",
                "data-block-type": "callout-component",
              },
              content: [
                {
                  type: CORE_EXTENSIONS.PARAGRAPH,
                  content: [{ type: "text", marks: [{ type: "bold" }], text: "💡 راهنمای میانبرهای سریع:" }],
                },
                {
                  type: CORE_EXTENSIONS.BULLET_LIST,
                  content: [
                    {
                      type: CORE_EXTENSIONS.LIST_ITEM,
                      content: [
                        {
                          type: CORE_EXTENSIONS.PARAGRAPH,
                          content: [{ type: "text", text: "# برای تیتر ۱ | ## برای تیتر ۲ | ### برای تیتر ۳" }],
                        },
                      ],
                    },
                    {
                      type: CORE_EXTENSIONS.LIST_ITEM,
                      content: [
                        {
                          type: CORE_EXTENSIONS.PARAGRAPH,
                          content: [
                            { type: "text", text: "- یا * برای لیست نقطه‌ای | 1. برای لیست عددی | [] برای چک‌لیست" },
                          ],
                        },
                      ],
                    },
                    {
                      type: CORE_EXTENSIONS.LIST_ITEM,
                      content: [
                        {
                          type: CORE_EXTENSIONS.PARAGRAPH,
                          content: [{ type: "text", text: "> برای نقل‌قول | ``` برای کادر کد | Cmd+D برای تکثیر بلوک" }],
                        },
                      ],
                    },
                  ],
                },
              ],
            })
            .run();
        },
        section: "highlights",
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
        section: "embeds",
        pushAfter: "shortcuts",
      },
      {
        commandKey: "youtube",
        key: "youtube",
        title: "YouTube Video",
        icon: <Play className="text-red-500 size-3.5" />,
        description: "Embed an interactive YouTube video player",
        searchTerms: ["youtube", "video", "yt", "stream"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "youtube" });
        },
        section: "embeds",
        pushAfter: "embed",
      },
      {
        commandKey: "aparat",
        key: "aparat",
        title: "Aparat Video / آپارات",
        icon: <Play className="text-pink-500 size-3.5" />,
        description: "Embed an Aparat video player",
        searchTerms: ["aparat", "video", "clip", "aparat video"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "aparat" });
        },
        section: "embeds",
        pushAfter: "youtube",
      },
      {
        commandKey: "figma",
        key: "figma",
        title: "Figma Prototype",
        icon: <Figma className="text-purple-500 size-3.5" />,
        description: "Embed a live Figma frame or prototype",
        searchTerms: ["figma", "design", "ui", "ux", "prototype"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "figma" });
        },
        section: "embeds",
        pushAfter: "aparat",
      },
      {
        commandKey: "codepen",
        key: "codepen",
        title: "CodePen Snippet",
        icon: <Code className="text-teal-500 size-3.5" />,
        description: "Embed an interactive CodePen demo",
        searchTerms: ["codepen", "code", "html", "css", "js", "demo"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "codepen" });
        },
        section: "embeds",
        pushAfter: "figma",
      },
      // Database & Work Items
      {
        commandKey: "database",
        key: "database",
        title: "Database / پایگاه داده",
        icon: <Database className="size-3.5 text-accent-primary" />,
        description: "Embed or link a database work item card",
        searchTerms: ["database", "table", "data", "dastebandi", "record"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent("@").run();
        },
        section: "badges",
        pushAfter: "codepen",
      },
      {
        commandKey: "issue",
        key: "issue",
        title: "Work Item / کارت تسک",
        icon: <Database className="text-blue-500 size-3.5" />,
        description: "Insert a live database work item card",
        searchTerms: ["issue", "work item", "task", "card", "kart"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent("@").run();
        },
        section: "badges",
        pushAfter: "database",
      },
      // Mermaid Diagrams & Flowcharts
      {
        commandKey: "mermaid",
        key: "mermaid",
        title: "Mermaid Diagram / فلوچارت",
        icon: <GitFork className="text-indigo-500 size-3.5" />,
        description: "Insert a Mermaid.js diagram or flowchart block",
        searchTerms: ["mermaid", "diagram", "flowchart", "chart", "graph", "nemoodar"],
        command: ({ editor, range }: CommandProps) => {
          const starterDiagram = `graph TD\n  A[شروع پروژه] --> B[طراحی و برنامه‌ریزی]\n  B --> C[پیاده‌سازی و توسعه]\n  C --> D[تست و انتشار نهایی]`;
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CODE_BLOCK,
              attrs: {
                language: "mermaid",
              },
              content: [{ type: "text", text: starterDiagram }],
            })
            .run();
        },
        section: "embeds",
        pushAfter: "issue",
      },
      // Audio Streaming
      {
        commandKey: "spotify",
        key: "spotify",
        title: "Spotify Audio / پادکست",
        icon: <Music className="text-green-500 size-3.5" />,
        description: "Embed a Spotify track, album, or podcast",
        searchTerms: ["spotify", "music", "audio", "podcast", "song", "ahange"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "spotify" });
        },
        section: "embeds",
        pushAfter: "mermaid",
      },
      {
        commandKey: "soundcloud",
        key: "soundcloud",
        title: "SoundCloud Audio",
        icon: <Music className="text-orange-500 size-3.5" />,
        description: "Embed a SoundCloud audio track or playlist",
        searchTerms: ["soundcloud", "music", "audio", "track"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "soundcloud" });
        },
        section: "embeds",
        pushAfter: "spotify",
      },
      // Duplicate Block
      {
        commandKey: "duplicate",
        key: "duplicate",
        title: "Duplicate / تکثیر بلوک",
        icon: <Copy className="size-3.5 text-accent-primary" />,
        description: "Duplicate current block (Cmd+D / Ctrl+D)",
        searchTerms: ["duplicate", "copy block", "clone", "taksir", "kopi"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          const { state } = editor;
          const { selection } = state;
          const { $from } = selection;
          if ($from.depth <= 0) return;

          let targetDepth = 1;
          for (let d = $from.depth; d >= 1; d--) {
            const n = $from.node(d);
            if (n.type.name === "listItem" || n.type.name === "taskItem") {
              targetDepth = d;
              break;
            }
          }

          const node = $from.node(targetDepth);
          const posAfter = $from.after(targetDepth);
          if (node) {
            editor.chain().focus().insertContentAt(posAfter, node.toJSON()).run();
          }
        },
        section: "structure",
        pushAfter: "soundcloud",
      },
      // Turn Into Commands
      {
        commandKey: "turn-h1",
        key: "turn-h1",
        title: "Turn into Heading 1",
        icon: <RefreshCw className="text-blue-500 size-3.5" />,
        description: "Transform current block into Heading 1",
        searchTerms: ["turn into heading 1", "turn h1", "convert h1", "tabdil"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
        },
        section: "structure",
        pushAfter: "duplicate",
      },
      {
        commandKey: "turn-h2",
        key: "turn-h2",
        title: "Turn into Heading 2",
        icon: <RefreshCw className="text-blue-500 size-3.5" />,
        description: "Transform current block into Heading 2",
        searchTerms: ["turn into heading 2", "turn h2", "convert h2"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
        },
        section: "structure",
        pushAfter: "turn-h1",
      },
      {
        commandKey: "turn-h3",
        key: "turn-h3",
        title: "Turn into Heading 3",
        icon: <RefreshCw className="text-blue-500 size-3.5" />,
        description: "Transform current block into Heading 3",
        searchTerms: ["turn into heading 3", "turn h3", "convert h3"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
        },
        section: "structure",
        pushAfter: "turn-h2",
      },
      {
        commandKey: "turn-quote",
        key: "turn-quote",
        title: "Turn into Quote",
        icon: <RefreshCw className="text-amber-500 size-3.5" />,
        description: "Transform current block into Quote",
        searchTerms: ["turn into quote", "turn quote", "convert quote"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).toggleBlockquote().run();
        },
        section: "structure",
        pushAfter: "turn-h3",
      },
      {
        commandKey: "turn-todo",
        key: "turn-todo",
        title: "Turn into To-do List",
        icon: <RefreshCw className="text-emerald-500 size-3.5" />,
        description: "Transform current block into To-do checklist",
        searchTerms: ["turn into todo", "turn todo", "convert todo", "checklist"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).toggleTaskList().run();
        },
        section: "structure",
        pushAfter: "turn-quote",
      },
      {
        commandKey: "turn-bullet",
        key: "turn-bullet",
        title: "Turn into Bullet List",
        icon: <RefreshCw className="text-purple-500 size-3.5" />,
        description: "Transform current block into Bullet list",
        searchTerms: ["turn into bullet", "turn bullet", "convert list"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
        section: "structure",
        pushAfter: "turn-todo",
      },
      {
        commandKey: "turn-number",
        key: "turn-number",
        title: "Turn into Numbered List",
        icon: <RefreshCw className="text-indigo-500 size-3.5" />,
        description: "Transform current block into Numbered list",
        searchTerms: ["turn into numbered", "turn number", "convert number"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).toggleOrderedList().run();
        },
        section: "structure",
        pushAfter: "turn-bullet",
      },
      {
        commandKey: "turn-code",
        key: "turn-code",
        title: "Turn into Code Block",
        icon: <RefreshCw className="text-teal-500 size-3.5" />,
        description: "Transform current block into Code block",
        searchTerms: ["turn into code", "turn code", "convert code"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
        },
        section: "structure",
        pushAfter: "turn-number",
      },
      {
        commandKey: "turn-callout",
        key: "turn-callout",
        title: "Turn into Callout",
        icon: <RefreshCw className="text-rose-500 size-3.5" />,
        description: "Transform current block into Callout box",
        searchTerms: ["turn into callout", "turn callout", "convert callout"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertCallout().run();
        },
        section: "structure",
        pushAfter: "turn-code",
      },
      // Toggle Headings
      {
        commandKey: "toggle-h1",
        key: "toggle-h1",
        title: "Toggle Heading 1 / تیتر تاشو ۱",
        icon: <ChevronRight className="text-blue-500 size-3.5" />,
        description: "Insert a collapsible Heading 1 section",
        searchTerms: ["toggle h1", "collapsible h1", "heading 1 toggle", "titr tasho"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertToggle({ headingLevel: 1 }).run();
        },
        section: "structure",
        pushAfter: "turn-callout",
      },
      {
        commandKey: "toggle-h2",
        key: "toggle-h2",
        title: "Toggle Heading 2 / تیتر تاشو ۲",
        icon: <ChevronRight className="text-blue-500 size-3.5" />,
        description: "Insert a collapsible Heading 2 section",
        searchTerms: ["toggle h2", "collapsible h2", "heading 2 toggle"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertToggle({ headingLevel: 2 }).run();
        },
        section: "structure",
        pushAfter: "toggle-h1",
      },
      {
        commandKey: "toggle-h3",
        key: "toggle-h3",
        title: "Toggle Heading 3 / تیتر تاشو ۳",
        icon: <ChevronRight className="text-blue-500 size-3.5" />,
        description: "Insert a collapsible Heading 3 section",
        searchTerms: ["toggle h3", "collapsible h3", "heading 3 toggle"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertToggle({ headingLevel: 3 }).run();
        },
        section: "structure",
        pushAfter: "toggle-h2",
      },
      // GitHub & Gist Embeds
      {
        commandKey: "gist",
        key: "gist",
        title: "GitHub Gist",
        icon: <Code className="text-slate-700 size-3.5" />,
        description: "Embed a GitHub Gist code snippet",
        searchTerms: ["gist", "github gist", "snippet", "code"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "gist" });
        },
        section: "embeds",
        pushAfter: "toggle-h3",
      },
      {
        commandKey: "github",
        key: "github",
        title: "GitHub Repository",
        icon: <GitFork className="text-slate-700 size-3.5" />,
        description: "Embed a GitHub repository link or card",
        searchTerms: ["github", "repo", "repository", "git"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).run();
          editor.commands.insertEmbed({ provider: "github" });
        },
        section: "embeds",
        pushAfter: "gist",
      },
      // Lock Mode Callout / Badge
      {
        commandKey: "lock",
        key: "lock",
        title: "Lock Notice / قفل حفاظت سند",
        icon: <Lock className="text-amber-500 size-3.5" />,
        description: "Insert a locked document protection notice",
        searchTerms: ["lock", "protect", "read only", "ghofl", "mohafezat"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "1f512",
                "data-background": "rgb(254, 243, 199)",
                "data-block-type": "callout-component",
              },
              content: [
                {
                  type: CORE_EXTENSIONS.PARAGRAPH,
                  content: [
                    {
                      type: "text",
                      marks: [{ type: "bold" }],
                      text: "🔒 این سند نهایی و قفل شده است: ",
                    },
                    {
                      type: "text",
                      text: "جهت حفظ یکپارچگی اطلاعات، لطفاً از ایجاد تغییرات ناخواسته خودداری فرمایید.",
                    },
                  ],
                },
              ],
            })
            .run();
        },
        section: "structure",
        pushAfter: "github",
      },
      // Status Badges
      {
        commandKey: "badge-done",
        key: "badge-done",
        title: "Done Badge / بج انجام شد",
        icon: <CheckCircle2 className="text-emerald-500 size-3.5" />,
        description: "Insert a green Done status badge",
        searchTerms: ["done", "badge done", "complete", "anjam shod", "vaziat"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(" `✅ انجام شد` ").run();
        },
        section: "badges",
        pushAfter: "lock",
      },
      {
        commandKey: "badge-progress",
        key: "badge-progress",
        title: "In Progress Badge / بج در حال انجام",
        icon: <Clock className="text-amber-500 size-3.5" />,
        description: "Insert a yellow In Progress status badge",
        searchTerms: ["in progress", "progress", "doing", "dar hal anjam"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(" `🔄 در حال انجام` ").run();
        },
        section: "badges",
        pushAfter: "badge-done",
      },
      {
        commandKey: "badge-blocked",
        key: "badge-blocked",
        title: "Blocked Badge / بج متوقف شده",
        icon: <AlertCircle className="text-red-500 size-3.5" />,
        description: "Insert a red Blocked status badge",
        searchTerms: ["blocked", "stop", "khatar", "motevaghef"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(" `⛔ متوقف شده` ").run();
        },
        section: "badges",
        pushAfter: "badge-progress",
      },
      {
        commandKey: "badge-review",
        key: "badge-review",
        title: "In Review Badge / بج در حال بررسی",
        icon: <Eye className="text-blue-500 size-3.5" />,
        description: "Insert a blue In Review status badge",
        searchTerms: ["in review", "review", "barrasi"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(" `👀 در حال بررسی` ").run();
        },
        section: "badges",
        pushAfter: "badge-blocked",
      },
      {
        commandKey: "badge-todo",
        key: "badge-todo",
        title: "To Do Badge / بج در انتظار",
        icon: <Tag className="text-slate-500 size-3.5" />,
        description: "Insert a gray To Do status badge",
        searchTerms: ["todo", "badge todo", "backlog", "entezar"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(" `📋 در انتظار` ").run();
        },
        section: "badges",
        pushAfter: "badge-review",
      },
      // Smart Relative Dates
      {
        commandKey: "tomorrow",
        key: "tomorrow",
        title: "Tomorrow / تاریخ فردا",
        icon: <Calendar className="text-emerald-500 size-3.5" />,
        description: "Insert tomorrow's formatted date",
        searchTerms: ["tomorrow", "farda", "date"],
        command: ({ editor, range }: CommandProps) => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const formatted = tomorrow.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
          editor.chain().focus().deleteRange(range).insertContent(`📅 فردا (${formatted}) `).run();
        },
        section: "templates",
        pushAfter: "badge-todo",
      },
      {
        commandKey: "yesterday",
        key: "yesterday",
        title: "Yesterday / تاریخ دیروز",
        icon: <Calendar className="text-slate-500 size-3.5" />,
        description: "Insert yesterday's formatted date",
        searchTerms: ["yesterday", "dirooz", "date"],
        command: ({ editor, range }: CommandProps) => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const formatted = yesterday.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
          editor.chain().focus().deleteRange(range).insertContent(`📅 دیروز (${formatted}) `).run();
        },
        section: "templates",
        pushAfter: "tomorrow",
      },
      // Document Templates
      {
        commandKey: "template-meeting",
        key: "template-meeting",
        title: "Meeting Notes Template / قالب جلسه",
        icon: <Users className="text-blue-500 size-3.5" />,
        description: "Insert a structured meeting agenda & notes template",
        searchTerms: ["meeting", "agenda", "notes", "jalase", "ghaleb"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 3 },
                content: [{ type: "text", text: "📝 صورتجلسه و تصمیمات" }],
              },
              {
                type: CORE_EXTENSIONS.BULLET_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      {
                        type: CORE_EXTENSIONS.PARAGRAPH,
                        content: [{ type: "text", marks: [{ type: "bold" }], text: "📅 تاریخ: " }],
                      },
                    ],
                  },
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      {
                        type: CORE_EXTENSIONS.PARAGRAPH,
                        content: [{ type: "text", marks: [{ type: "bold" }], text: "👥 حاضرین: " }],
                      },
                    ],
                  },
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      {
                        type: CORE_EXTENSIONS.PARAGRAPH,
                        content: [{ type: "text", marks: [{ type: "bold" }], text: "🎯 هدف جلسه: " }],
                      },
                    ],
                  },
                ],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "📌 مباحث مطرح‌شده" }],
              },
              {
                type: CORE_EXTENSIONS.ORDERED_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [{ type: CORE_EXTENSIONS.PARAGRAPH, content: [{ type: "text", text: "مورد اول..." }] }],
                  },
                ],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "✅ اقدامات و تسک‌های بعدی (Action Items)" }],
              },
              {
                type: CORE_EXTENSIONS.TASK_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.TASK_ITEM,
                    attrs: { checked: false },
                    content: [{ type: CORE_EXTENSIONS.PARAGRAPH, content: [{ type: "text", text: "تسک ۱ (@مسئول)" }] }],
                  },
                  {
                    type: CORE_EXTENSIONS.TASK_ITEM,
                    attrs: { checked: false },
                    content: [{ type: CORE_EXTENSIONS.PARAGRAPH, content: [{ type: "text", text: "تسک ۲ (@مسئول)" }] }],
                  },
                ],
              },
            ])
            .run();
        },
        section: "templates",
        pushAfter: "yesterday",
      },
      {
        commandKey: "template-bug",
        key: "template-bug",
        title: "Bug Report Template / قالب گزارش باگ",
        icon: <Bug className="text-red-500 size-3.5" />,
        description: "Insert a structured bug report template",
        searchTerms: ["bug", "issue", "report", "khata", "gozaresh"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 3 },
                content: [{ type: "text", text: "🐛 گزارش باگ و خطا" }],
              },
              {
                type: CORE_EXTENSIONS.BULLET_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      {
                        type: CORE_EXTENSIONS.PARAGRAPH,
                        content: [{ type: "text", marks: [{ type: "bold" }], text: "🔍 شرح مشکل: " }],
                      },
                    ],
                  },
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      {
                        type: CORE_EXTENSIONS.PARAGRAPH,
                        content: [
                          { type: "text", marks: [{ type: "bold" }], text: "⚡ اولویت: " },
                          { type: "text", text: "🔴 بالا" },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "📋 مراحل بازتولید (Steps to Reproduce)" }],
              },
              {
                type: CORE_EXTENSIONS.ORDERED_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      { type: CORE_EXTENSIONS.PARAGRAPH, content: [{ type: "text", text: "۱. وارد بخش ... شوید" }] },
                    ],
                  },
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      {
                        type: CORE_EXTENSIONS.PARAGRAPH,
                        content: [{ type: "text", text: "۲. روی دکمه ... کلیک کنید" }],
                      },
                    ],
                  },
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      {
                        type: CORE_EXTENSIONS.PARAGRAPH,
                        content: [{ type: "text", text: "۳. خطای ... مشاهده می‌شود" }],
                      },
                    ],
                  },
                ],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "🎯 رفتار مورد انتظار (Expected Behavior)" }],
              },
              {
                type: CORE_EXTENSIONS.BLOCKQUOTE,
                content: [
                  {
                    type: CORE_EXTENSIONS.PARAGRAPH,
                    content: [{ type: "text", text: "رفتار صحیح برنامه باید این‌گونه باشد..." }],
                  },
                ],
              },
            ])
            .run();
        },
        section: "templates",
        pushAfter: "template-meeting",
      },
      {
        commandKey: "template-standup",
        key: "template-standup",
        title: "Daily Standup / استندآپ روزانه",
        icon: <Flame className="text-amber-500 size-3.5" />,
        description: "Insert a daily standup update template",
        searchTerms: ["standup", "daily", "update", "roozane"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 3 },
                content: [{ type: "text", text: "☀️ استندآپ روزانه" }],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "✅ کارهای انجام‌شده دیروز:" }],
              },
              {
                type: CORE_EXTENSIONS.BULLET_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [{ type: CORE_EXTENSIONS.PARAGRAPH, content: [{ type: "text", text: "تکمیل بخش..." }] }],
                  },
                ],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "🎯 برنامه‌های امروز:" }],
              },
              {
                type: CORE_EXTENSIONS.TASK_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.TASK_ITEM,
                    attrs: { checked: false },
                    content: [
                      { type: CORE_EXTENSIONS.PARAGRAPH, content: [{ type: "text", text: "پیاده‌سازی فیچر..." }] },
                    ],
                  },
                ],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "⛔ موانع و چالش‌ها (Blockers):" }],
              },
              {
                type: CORE_EXTENSIONS.BULLET_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [{ type: CORE_EXTENSIONS.PARAGRAPH, content: [{ type: "text", text: "ندارد" }] }],
                  },
                ],
              },
            ])
            .run();
        },
        section: "templates",
        pushAfter: "template-bug",
      },
      {
        commandKey: "template-rfc",
        key: "template-rfc",
        title: "RFC / Design Doc Template",
        icon: <Code className="text-indigo-500 size-3.5" />,
        description: "Insert a technical design document template",
        searchTerms: ["rfc", "design doc", "architecture", "memari"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent([
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 3 },
                content: [{ type: "text", text: "📐 سند طراحی فنی (RFC / Design Doc)" }],
              },
              {
                type: CORE_EXTENSIONS.BULLET_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      {
                        type: CORE_EXTENSIONS.PARAGRAPH,
                        content: [{ type: "text", marks: [{ type: "bold" }], text: "نویسنده: " }],
                      },
                    ],
                  },
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      {
                        type: CORE_EXTENSIONS.PARAGRAPH,
                        content: [
                          { type: "text", marks: [{ type: "bold" }], text: "وضعیت: " },
                          { type: "text", text: "👀 در حال بررسی" },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "1. خلاصه و صورت مسئله (Problem Statement)" }],
              },
              {
                type: CORE_EXTENSIONS.PARAGRAPH,
                content: [{ type: "text", text: "شرح خلاصه مسئله..." }],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "2. معماری پیشنهادی (Proposed Architecture)" }],
              },
              {
                type: CORE_EXTENSIONS.CODE_BLOCK,
                attrs: { language: "mermaid" },
                content: [{ type: "text", text: "graph TD\n  Client --> Gateway\n  Gateway --> Service" }],
              },
              {
                type: CORE_EXTENSIONS.HEADING,
                attrs: { level: 4 },
                content: [{ type: "text", text: "3. راهکارهای جایگزین و ریسک‌ها (Trade-offs & Risks)" }],
              },
              {
                type: CORE_EXTENSIONS.BULLET_LIST,
                content: [
                  {
                    type: CORE_EXTENSIONS.LIST_ITEM,
                    content: [
                      { type: CORE_EXTENSIONS.PARAGRAPH, content: [{ type: "text", text: "ریسک شماره ۱..." }] },
                    ],
                  },
                ],
              },
            ])
            .run();
        },
        section: "templates",
        pushAfter: "template-standup",
      },
      // Priority & Ratings
      {
        commandKey: "stars",
        key: "stars",
        title: "Star Rating / امتیاز ستاره‌ای",
        icon: <Star className="text-amber-400 fill-amber-400 size-3.5" />,
        description: "Insert 5 star rating (⭐⭐⭐⭐⭐)",
        searchTerms: ["star", "rating", "emtiaz", "setare"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent("⭐⭐⭐⭐⭐ ").run();
        },
        section: "badges",
        pushAfter: "template-rfc",
      },
      {
        commandKey: "priority-high",
        key: "priority-high",
        title: "Priority: High / اولویت بالا",
        icon: <Flame className="text-red-500 size-3.5" />,
        description: "Insert High Priority badge (🔴 اولویت بالا)",
        searchTerms: ["priority high", "high", "olaviat bala", "fori"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(" `🔴 اولویت بالا` ").run();
        },
        section: "badges",
        pushAfter: "stars",
      },
      {
        commandKey: "priority-medium",
        key: "priority-medium",
        title: "Priority: Medium / اولویت متوسط",
        icon: <Clock className="text-amber-500 size-3.5" />,
        description: "Insert Medium Priority badge (🟡 اولویت متوسط)",
        searchTerms: ["priority medium", "medium", "olaviat motevaset"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(" `🟡 اولویت متوسط` ").run();
        },
        section: "badges",
        pushAfter: "priority-high",
      },
      {
        commandKey: "priority-low",
        key: "priority-low",
        title: "Priority: Low / اولویت پایین",
        icon: <CheckCircle2 className="text-emerald-500 size-3.5" />,
        description: "Insert Low Priority badge (🟢 اولویت پایین)",
        searchTerms: ["priority low", "low", "olaviat paeen"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(" `🟢 اولویت پایین` ").run();
        },
        section: "badges",
        pushAfter: "priority-medium",
      },
      {
        commandKey: "progress",
        key: "progress",
        title: "Progress Bar / نوار پیشرفت",
        icon: <Tag className="text-blue-500 size-3.5" />,
        description: "Insert a visual progress bar ([█████░░░░░] 50%)",
        searchTerms: ["progress", "bar", "pishraft", "darsad"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).insertContent(" `[█████░░░░░] 50%` ").run();
        },
        section: "badges",
        pushAfter: "priority-low",
      },
      // Callout Color Themes
      {
        commandKey: "callout-pink",
        key: "callout-pink",
        title: "Callout: Pink / صورتی",
        icon: <Palette className="text-pink-500 size-3.5" />,
        description: "Insert a pastel pink callout box",
        searchTerms: ["callout pink", "pink", "soorati"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "1f338",
                "data-background": "rgb(253, 242, 248)",
                "data-block-type": "callout-component",
              },
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            })
            .run();
        },
        section: "highlights",
        pushAfter: "progress",
      },
      {
        commandKey: "callout-purple",
        key: "callout-purple",
        title: "Callout: Purple / بنفش",
        icon: <Palette className="text-purple-500 size-3.5" />,
        description: "Insert a pastel purple callout box",
        searchTerms: ["callout purple", "purple", "banafshe"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "1f52e",
                "data-background": "rgb(245, 243, 255)",
                "data-block-type": "callout-component",
              },
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            })
            .run();
        },
        section: "highlights",
        pushAfter: "callout-pink",
      },
      {
        commandKey: "callout-cyan",
        key: "callout-cyan",
        title: "Callout: Cyan / فیروزه‌ای",
        icon: <Palette className="text-cyan-500 size-3.5" />,
        description: "Insert a pastel cyan/teal callout box",
        searchTerms: ["callout cyan", "cyan", "teal", "firoozei"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "1f48e",
                "data-background": "rgb(236, 254, 255)",
                "data-block-type": "callout-component",
              },
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            })
            .run();
        },
        section: "highlights",
        pushAfter: "callout-purple",
      },
      {
        commandKey: "callout-orange",
        key: "callout-orange",
        title: "Callout: Orange / نارنجی",
        icon: <Palette className="text-orange-500 size-3.5" />,
        description: "Insert a pastel orange callout box",
        searchTerms: ["callout orange", "orange", "narenji"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "1f34a",
                "data-background": "rgb(255, 247, 237)",
                "data-block-type": "callout-component",
              },
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            })
            .run();
        },
        section: "highlights",
        pushAfter: "callout-cyan",
      },
      {
        commandKey: "callout-gray",
        key: "callout-gray",
        title: "Callout: Gray / خاکستری",
        icon: <Palette className="text-gray-500 size-3.5" />,
        description: "Insert a subtle gray callout box",
        searchTerms: ["callout gray", "gray", "toosi", "khakestari"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: CORE_EXTENSIONS.CALLOUT,
              attrs: {
                "data-logo-in-use": "emoji",
                "data-emoji-unicode": "1f4cc",
                "data-background": "rgb(243, 244, 246)",
                "data-block-type": "callout-component",
              },
              content: [{ type: CORE_EXTENSIONS.PARAGRAPH }],
            })
            .run();
        },
        section: "highlights",
        pushAfter: "callout-orange",
      },
      // Highlighter Pen Tools
      {
        commandKey: "highlight-yellow",
        key: "highlight-yellow",
        title: "Highlight: Yellow / هایلایت زرد",
        icon: <Tag className="text-amber-500 size-3.5" />,
        description: "Highlight text with yellow background",
        searchTerms: ["highlight yellow", "yellow bg", "zard", "majik"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setBackgroundColor("var(--editor-colors-peach-background)").run();
        },
        section: "highlights",
        pushAfter: "callout-gray",
      },
      {
        commandKey: "highlight-green",
        key: "highlight-green",
        title: "Highlight: Green / هایلایت سبز",
        icon: <Tag className="text-emerald-500 size-3.5" />,
        description: "Highlight text with green background",
        searchTerms: ["highlight green", "green bg", "sabz"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setBackgroundColor("var(--editor-colors-green-background)").run();
        },
        section: "highlights",
        pushAfter: "highlight-yellow",
      },
      {
        commandKey: "highlight-pink",
        key: "highlight-pink",
        title: "Highlight: Pink / هایلایت صورتی",
        icon: <Tag className="text-pink-500 size-3.5" />,
        description: "Highlight text with pink background",
        searchTerms: ["highlight pink", "pink bg", "soorati"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setBackgroundColor("var(--editor-colors-pink-background)").run();
        },
        section: "highlights",
        pushAfter: "highlight-green",
      },
      {
        commandKey: "highlight-blue",
        key: "highlight-blue",
        title: "Highlight: Blue / هایلایت آبی",
        icon: <Tag className="text-blue-500 size-3.5" />,
        description: "Highlight text with blue background",
        searchTerms: ["highlight blue", "blue bg", "abi"],
        command: ({ editor, range }: CommandProps) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setBackgroundColor("var(--editor-colors-light-blue-background)")
            .run();
        },
        section: "highlights",
        pushAfter: "highlight-pink",
      },
      {
        commandKey: "highlight-purple",
        key: "highlight-purple",
        title: "Highlight: Purple / هایلایت بنفش",
        icon: <Tag className="text-purple-500 size-3.5" />,
        description: "Highlight text with purple background",
        searchTerms: ["highlight purple", "purple bg", "banafshe"],
        command: ({ editor, range }: CommandProps) => {
          editor.chain().focus().deleteRange(range).setBackgroundColor("var(--editor-colors-purple-background)").run();
        },
        section: "highlights",
        pushAfter: "highlight-blue",
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
            item.description?.toLowerCase().includes(lowercaseQuery) ||
            item.searchTerms.some((t) => t.includes(lowercaseQuery))
          );
        }),
      })
    );

    return filteredSlashSections.filter((s) => s.items.length !== 0);
  };

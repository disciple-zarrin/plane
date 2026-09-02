/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { PageProps, Styles } from "@react-pdf/renderer";
import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Html } from "react-pdf-html";
import React from "react";
import interBold from "@/app/assets/fonts/inter/bold.ttf?url";
import interHeavy from "@/app/assets/fonts/inter/heavy.ttf?url";
import interLight from "@/app/assets/fonts/inter/light.ttf?url";
import interMedium from "@/app/assets/fonts/inter/medium.ttf?url";
import interRegular from "@/app/assets/fonts/inter/regular.ttf?url";
import interSemibold from "@/app/assets/fonts/inter/semibold.ttf?url";
import interThin from "@/app/assets/fonts/inter/thin.ttf?url";
import interUltraBold from "@/app/assets/fonts/inter/ultrabold.ttf?url";
import interUltraLight from "@/app/assets/fonts/inter/ultralight.ttf?url";
import vazirBold from "@/app/assets/fonts/vazirmatn/Vazirmatn-Bold.ttf?url";
import vazirRegular from "@/app/assets/fonts/vazirmatn/Vazirmatn-Regular.ttf?url";
import { convertRemToPixel } from "@plane/utils";

const EDITOR_PDF_TYPOGRAPHY_STYLES: Styles = {
  "h1.page-title": {
    fontSize: convertRemToPixel(1.6),
    fontWeight: "bold",
    marginTop: 0,
    marginBottom: convertRemToPixel(2),
  },
  "h1.page-title[dir='rtl'], h1.page-title[dir=\"rtl\"]": {
    direction: "rtl",
    textAlign: "right",
  },
  "h1.page-title[dir='ltr'], h1.page-title[dir=\"ltr\"]": {
    direction: "ltr",
    textAlign: "left",
  },
  "h1:not(.page-title)": {
    fontSize: convertRemToPixel(1.4),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(2),
    marginBottom: convertRemToPixel(0.25),
  },
  h2: {
    fontSize: convertRemToPixel(1.2),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1.4),
    marginBottom: convertRemToPixel(0.0625),
  },
  h3: {
    fontSize: convertRemToPixel(1.1),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1),
    marginBottom: convertRemToPixel(0.0625),
  },
  h4: {
    fontSize: convertRemToPixel(1),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1),
    marginBottom: convertRemToPixel(0.0625),
  },
  h5: {
    fontSize: convertRemToPixel(0.9),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1),
    marginBottom: convertRemToPixel(0.0625),
  },
  h6: {
    fontSize: convertRemToPixel(0.8),
    fontWeight: "semibold",
    marginTop: convertRemToPixel(1),
    marginBottom: convertRemToPixel(0.0625),
  },
  "p:not(table p)": {
    fontSize: convertRemToPixel(0.8),
  },
  "p:not(ol p, ul p)": {
    marginTop: convertRemToPixel(0.25),
    marginBottom: convertRemToPixel(0.0625),
  },
};

const EDITOR_PDF_LIST_BASE: Styles = {
  "ul, ol": {
    fontSize: convertRemToPixel(0.8),
    marginHorizontal: -20,
  },
  "ol p, ul p": {
    marginVertical: 0,
  },
  "ol li, ul li": {
    marginTop: convertRemToPixel(0.45),
  },
  "ul ul, ul ol, ol ol, ol ul": {
    marginVertical: 0,
  },
  "ul[data-type='taskList']": {
    position: "relative",
  },
  "div.input-checkbox:not(.checked)": {
    backgroundColor: "#ffffff",
    borderColor: "#171717",
  },
  "div.input-checkbox.checked": {
    backgroundColor: "#3f76ff",
    borderColor: "#3f76ff",
  },
  "ul li[data-checked='true'] p": {
    color: "#a3a3a3",
  },
};

const EDITOR_PDF_CODE_STYLES: Styles = {
  "[data-node-type='code-block']": {
    marginVertical: convertRemToPixel(0.5),
    padding: convertRemToPixel(1),
    borderRadius: convertRemToPixel(0.5),
    backgroundColor: "#f7f7f7",
    fontSize: convertRemToPixel(0.7),
  },
  "[data-node-type='inline-code-block']": {
    margin: 0,
    paddingVertical: convertRemToPixel(0.25 / 4 + 0.25 / 8),
    paddingHorizontal: convertRemToPixel(0.375),
    border: "0.5px solid #e5e5e5",
    borderRadius: convertRemToPixel(0.25),
    backgroundColor: "#e8e8e8",
    color: "#f97316",
    fontSize: convertRemToPixel(0.7),
  },
};

const EDITOR_PDF_SHARED: Styles = {
  ...EDITOR_PDF_TYPOGRAPHY_STYLES,
  ...EDITOR_PDF_LIST_BASE,
  ...EDITOR_PDF_CODE_STYLES,
  blockquote: {
    borderLeft: "3px solid gray",
    paddingLeft: convertRemToPixel(1),
    marginTop: convertRemToPixel(0.625),
    marginBottom: 0,
    marginHorizontal: 0,
  },
  img: {
    marginVertical: 0,
    borderRadius: convertRemToPixel(0.375),
  },
  "div[data-type='horizontalRule']": {
    marginVertical: convertRemToPixel(1),
    height: 1,
    width: "100%",
    backgroundColor: "gray",
  },
  "[data-node-type='mention-block']": {
    margin: 0,
    color: "#3f76ff",
    backgroundColor: "#3f76ff33",
    paddingHorizontal: convertRemToPixel(0.375),
  },
  table: {
    marginTop: convertRemToPixel(0.5),
    marginBottom: convertRemToPixel(1),
    marginHorizontal: 0,
  },
  "table td": {
    padding: convertRemToPixel(0.5),
    border: "1px solid #e5e5e5",
  },
  "table p": {
    fontSize: convertRemToPixel(0.7),
  },
  a: {
    color: "#0563C1",
    textDecoration: "underline",
  },
};

function buildStylesheet(isRtl: boolean) {
  // Vazirmatn covers Latin + Persian so mixed content stays readable either direction.
  const fontFamily = "Vazirmatn";
  return StyleSheet.create({
    "*:not(.courier, .courier-bold)": { fontFamily },
    ".courier": { fontFamily: "Courier" },
    ".courier-bold": { fontFamily: "Courier-Bold" },
    ...EDITOR_PDF_SHARED,
    // Per-paragraph direction (Word-style) — must win over any page wrapper.
    "[dir='rtl'], [dir=\"rtl\"]": {
      direction: "rtl",
      textAlign: "right",
    },
    "[dir='ltr'], [dir=\"ltr\"]": {
      direction: "ltr",
      textAlign: "left",
    },
    "ul.toc": {
      marginHorizontal: 0,
      paddingHorizontal: 0,
    },
    "ul.toc li": {
      marginTop: convertRemToPixel(0.2),
    },
    "ul.toc li[dir='rtl'], ul.toc li[dir=\"rtl\"]": {
      direction: "rtl",
      textAlign: "right",
    },
    "ul.toc li[dir='ltr'], ul.toc li[dir=\"ltr\"]": {
      direction: "ltr",
      textAlign: "left",
    },
    "div.input-checkbox": {
      position: "absolute",
      top: convertRemToPixel(0.15),
      ...(isRtl ? { right: -convertRemToPixel(1.2) } : { left: -convertRemToPixel(1.2) }),
      height: convertRemToPixel(0.75),
      width: convertRemToPixel(0.75),
      borderWidth: "1.5px",
      borderStyle: "solid",
      borderRadius: convertRemToPixel(0.125),
    },
  });
}

Font.register({
  family: "Vazirmatn",
  fonts: [
    { src: vazirRegular, fontWeight: "thin" },
    { src: vazirRegular, fontWeight: "ultralight" },
    { src: vazirRegular, fontWeight: "light" },
    { src: vazirRegular, fontWeight: "normal" },
    { src: vazirRegular, fontWeight: "medium" },
    { src: vazirBold, fontWeight: "semibold" },
    { src: vazirBold, fontWeight: "bold" },
    { src: vazirBold, fontWeight: "ultrabold" },
    { src: vazirBold, fontWeight: "heavy" },
  ],
});

Font.register({
  family: "Inter",
  fonts: [
    { src: interThin, fontWeight: "thin" },
    { src: interThin, fontWeight: "thin", fontStyle: "italic" },
    { src: interUltraLight, fontWeight: "ultralight" },
    { src: interUltraLight, fontWeight: "ultralight", fontStyle: "italic" },
    { src: interLight, fontWeight: "light" },
    { src: interLight, fontWeight: "light", fontStyle: "italic" },
    { src: interRegular, fontWeight: "normal" },
    { src: interRegular, fontWeight: "normal", fontStyle: "italic" },
    { src: interMedium, fontWeight: "medium" },
    { src: interMedium, fontWeight: "medium", fontStyle: "italic" },
    { src: interSemibold, fontWeight: "semibold" },
    { src: interSemibold, fontWeight: "semibold", fontStyle: "italic" },
    { src: interBold, fontWeight: "bold" },
    { src: interBold, fontWeight: "bold", fontStyle: "italic" },
    { src: interUltraBold, fontWeight: "ultrabold" },
    { src: interUltraBold, fontWeight: "ultrabold", fontStyle: "italic" },
    { src: interHeavy, fontWeight: "heavy" },
    { src: interHeavy, fontWeight: "heavy", fontStyle: "italic" },
  ],
});

type Props = {
  content: string;
  pageFormat: PageProps["size"];
  /** Soft default for chrome/checkboxes only — block `dir` attrs override body text. */
  isRtl?: boolean;
};

/** Pass HTML `id` through so Link src="#id" can jump (react-pdf-html drops ids by default). */
function renderWithId(
  Component: any,
  // oxlint-disable-next-line typescript/no-explicit-any
  args: { style?: any; children?: React.ReactNode; element?: { attributes?: Record<string, string> } }
) {
  const { style, children, element } = args;
  const id = element?.attributes?.id;
  return React.createElement(Component as any, { style, ...(id ? { id } : {}) }, children);
}

const htmlRenderers = {
  // oxlint-disable-next-line typescript/no-explicit-any
  div: (args: any) => renderWithId(View, args),
  // oxlint-disable-next-line typescript/no-explicit-any
  h1: (args: any) => renderWithId(Text, args),
  // oxlint-disable-next-line typescript/no-explicit-any
  h2: (args: any) => renderWithId(Text, args),
  // oxlint-disable-next-line typescript/no-explicit-any
  h3: (args: any) => renderWithId(Text, args),
};

export function PDFDocument(props: Props) {
  const { content, pageFormat } = props;
  // Prefer explicit block dirs in HTML; prop is only a soft default for chrome.
  const contentHasRtl = /dir=["']rtl["']/i.test(content);
  const contentHasLtr = /dir=["']ltr["']/i.test(content);
  const mixed = contentHasRtl && contentHasLtr;
  const isRtl = props.isRtl ?? contentHasRtl;
  const stylesheet = buildStylesheet(isRtl);
  // Never force a whole-document text-align wrapper — it flattens mixed paragraphs.
  // Inline direction styles are applied in sanitizeHtmlForPdf / applyInlineDirectionStyles.
  const wrapped = content;

  return (
    <Document>
      <Page
        size={pageFormat}
        style={{
          backgroundColor: "#ffffff",
          padding: 48,
          // Mixed docs stay LTR at page level so LTR blocks aren't mirrored; RTL blocks set their own direction.
          direction: mixed ? "ltr" : isRtl ? "rtl" : "ltr",
          fontFamily: "Vazirmatn",
        }}
      >
        <Html stylesheet={stylesheet} renderers={htmlRenderers}>
          {wrapped}
        </Html>
      </Page>
    </Document>
  );
}

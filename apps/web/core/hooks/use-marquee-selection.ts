/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { TEntityDetails, TSelectionHelper } from "@/hooks/use-multiple-select";

type Props = {
  containerRef:
    | React.RefObject<HTMLElement | null>
    | React.MutableRefObject<HTMLDivElement | null>
    | React.MutableRefObject<HTMLElement | null>;
  selectionHelpers: TSelectionHelper;
  disabled?: boolean;
};

export type TMarqueeRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const DRAG_THRESHOLD = 5; // px

const INTERACTIVE_SELECTORS = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "[contenteditable='true']",
  "[role='button']",
  "[role='menuitem']",
  "[role='option']",
  "[data-prevent-marquee='true']",
].join(", ");

export const useMarqueeSelection = (props: Props) => {
  const { containerRef, selectionHelpers, disabled = false } = props;

  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<TMarqueeRect | null>(null);

  // Tracking refs to avoid stale closures and unnecessary re-renders
  const isDraggingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const initialSelectionRef = useRef<Map<string, TEntityDetails>>(new Map());
  const rafIdRef = useRef<number | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const lastPointerYRef = useRef<number>(0);
  const prevSelectedIdsRef = useRef<string>("");

  const { handleClearSelection, handleSetSelection, getIsEntitySelected, isSelectionDisabled, entitiesList } =
    selectionHelpers;

  const isGloballyDisabled = disabled || isSelectionDisabled;

  // Auto-scroll logic when dragging near container boundaries
  const handleAutoScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !isDraggingRef.current) return;

    const rect = container.getBoundingClientRect();
    const pointerY = lastPointerYRef.current;
    const EDGE_SIZE = 40;
    const MAX_SPEED = 12;

    if (pointerY < rect.top + EDGE_SIZE && pointerY >= rect.top - 10) {
      const intensity = Math.max(0, 1 - (pointerY - rect.top) / EDGE_SIZE);
      container.scrollTop -= MAX_SPEED * intensity;
    } else if (pointerY > rect.bottom - EDGE_SIZE && pointerY <= rect.bottom + 10) {
      const intensity = Math.max(0, 1 - (rect.bottom - pointerY) / EDGE_SIZE);
      container.scrollTop += MAX_SPEED * intensity;
    }

    if (isDraggingRef.current) {
      autoScrollRafRef.current = requestAnimationFrame(handleAutoScroll);
    }
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isGloballyDisabled) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Only primary left button
      if (e.button !== 0) return;
      // Do not activate on touch pointers to preserve native mobile scrolling
      if (e.pointerType === "touch") return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Filter out clicks on interactive elements
      if (target.closest(INTERACTIVE_SELECTORS)) return;

      const rowElement = target.closest("[data-issue-id]");
      const hasModifier = e.metaKey || e.ctrlKey || e.shiftKey;

      // If clicked on an issue row without modifiers, let standard row click/DnD handle it
      if (rowElement && !hasModifier) return;

      startPointRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;
      lastPointerYRef.current = e.clientY;

      // Snapshot current selection if user holds Cmd/Ctrl
      const currentSelectionMap = new Map<string, TEntityDetails>();
      if (hasModifier && entitiesList) {
        entitiesList.forEach((item) => {
          if (getIsEntitySelected(item.entityID)) {
            currentSelectionMap.set(item.entityID, item);
          }
        });
      }
      initialSelectionRef.current = currentSelectionMap;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (!startPointRef.current) return;
        lastPointerYRef.current = moveEvent.clientY;

        const deltaX = moveEvent.clientX - startPointRef.current.x;
        const deltaY = moveEvent.clientY - startPointRef.current.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (!isDraggingRef.current) {
          if (distance >= DRAG_THRESHOLD) {
            isDraggingRef.current = true;
            setIsMarqueeActive(true);
            // Start auto-scroller loop
            if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
            autoScrollRafRef.current = requestAnimationFrame(handleAutoScroll);
          } else {
            return;
          }
        }

        // Prevent default text selection while dragging marquee
        moveEvent.preventDefault();

        // Calculate marquee box in viewport coords
        const startX = startPointRef.current.x;
        const startY = startPointRef.current.y;
        const currentX = moveEvent.clientX;
        const currentY = moveEvent.clientY;

        const boxLeft = Math.min(startX, currentX);
        const boxTop = Math.min(startY, currentY);
        const boxRight = Math.max(startX, currentX);
        const boxBottom = Math.max(startY, currentY);

        // Schedule RAF for smooth UI update & hit test
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
          setMarqueeRect({
            left: boxLeft,
            top: boxTop,
            width: boxRight - boxLeft,
            height: boxBottom - boxTop,
          });

          // Hit detection on rendered issue rows
          const issueElements = container.querySelectorAll<HTMLElement>("[data-issue-id]");
          const newSelection = new Map<string, TEntityDetails>(initialSelectionRef.current);

          issueElements.forEach((el) => {
            const issueId = el.getAttribute("data-issue-id");
            const groupId = el.getAttribute("data-issue-group-id") || "";
            if (!issueId) return;

            const rect = el.getBoundingClientRect();
            // AABB intersection in viewport client space
            const intersects = !(
              boxRight < rect.left ||
              boxLeft > rect.right ||
              boxBottom < rect.top ||
              boxTop > rect.bottom
            );

            if (intersects) {
              newSelection.set(issueId, { entityID: issueId, groupID: groupId });
            } else if (!initialSelectionRef.current.has(issueId)) {
              newSelection.delete(issueId);
            }
          });

          const nextIds = Array.from(newSelection.keys()).toSorted().join(",");
          if (nextIds !== prevSelectedIdsRef.current) {
            prevSelectedIdsRef.current = nextIds;
            handleSetSelection(Array.from(newSelection.values()));
          }
        });
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);

        prevSelectedIdsRef.current = "";

        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        if (autoScrollRafRef.current) {
          cancelAnimationFrame(autoScrollRafRef.current);
          autoScrollRafRef.current = null;
        }

        if (isDraggingRef.current) {
          // Finished marquee drag
          isDraggingRef.current = false;
          setIsMarqueeActive(false);
          setMarqueeRect(null);
          startPointRef.current = null;
        } else {
          // Was a simple click on empty space without dragging
          startPointRef.current = null;
          const upTarget = upEvent.target as HTMLElement | null;
          if (upTarget && !upTarget.closest("[data-issue-id]") && !upTarget.closest(INTERACTIVE_SELECTORS)) {
            handleClearSelection();
          }
        }
      };

      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerUp);
    };

    container.addEventListener("pointerdown", handlePointerDown as EventListener);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown as EventListener);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
    };
  }, [
    containerRef,
    isGloballyDisabled,
    entitiesList,
    getIsEntitySelected,
    handleAutoScroll,
    handleClearSelection,
    handleSetSelection,
  ]);

  // Keyboard shortcut support: Escape (clear) & Cmd/Ctrl + A (select all)
  useEffect(() => {
    if (isGloballyDisabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, or rich text editor
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true'], .ProseMirror, .tiptap")) {
        return;
      }

      // Escape: clear selection
      if (e.key === "Escape") {
        handleClearSelection();
        return;
      }

      // Cmd/Ctrl + A: select all rendered issues in the view
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        const container = containerRef.current;
        if (!container) return;

        // Check if focus or mouse is within or related to this container/page
        e.preventDefault();

        if (entitiesList && entitiesList.length > 0) {
          handleSetSelection(entitiesList);
        } else {
          const issueElements = container.querySelectorAll<HTMLElement>("[data-issue-id]");
          const allItems: TEntityDetails[] = [];
          issueElements.forEach((el) => {
            const issueId = el.getAttribute("data-issue-id");
            const groupId = el.getAttribute("data-issue-group-id") || "";
            if (issueId) {
              allItems.push({ entityID: issueId, groupID: groupId });
            }
          });
          if (allItems.length > 0) {
            handleSetSelection(allItems);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, entitiesList, handleClearSelection, handleSetSelection, isGloballyDisabled]);

  return {
    isMarqueeActive,
    marqueeRect,
  };
};

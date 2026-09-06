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

const DRAG_THRESHOLD = 4; // px

const NON_MARQUEE_SELECTORS = [
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
  "[data-drag-handle='true']",
].join(", ");

export const useMarqueeSelection = (props: Props) => {
  const { containerRef, selectionHelpers, disabled = false } = props;

  const [isMarqueeActive, setIsMarqueeActive] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<TMarqueeRect | null>(null);

  // Tracking refs to avoid stale closures and unnecessary re-renders
  const isDraggingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentPointerIdRef = useRef<number | null>(null);
  const hasPointerCaptureRef = useRef(false);
  const clickedIssueRef = useRef<{ id: string; groupId: string } | null>(null);
  const initialSelectionRef = useRef<Map<string, TEntityDetails>>(new Map());
  const isModifierDragRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const autoScrollRafRef = useRef<number | null>(null);
  const prevSelectedIdsRef = useRef<string>("");

  const { handleClearSelection, handleSetSelection, getIsEntitySelected, isSelectionDisabled, entitiesList } =
    selectionHelpers;

  const isGloballyDisabled = disabled || isSelectionDisabled;

  // Global click suppressor in window capture phase
  useEffect(() => {
    const handleClickCapture = (e: MouseEvent) => {
      if (suppressNextClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        suppressNextClickRef.current = false;
      }
    };

    window.addEventListener("click", handleClickCapture, true);
    return () => {
      window.removeEventListener("click", handleClickCapture, true);
    };
  }, []);

  // Update selection and marquee bounding box
  const updateSelectionAndMarquee = useCallback(
    (currentX: number, currentY: number) => {
      if (!startPointRef.current) return;

      const startX = startPointRef.current.x;
      const startY = startPointRef.current.y;

      const boxLeft = Math.min(startX, currentX);
      const boxTop = Math.min(startY, currentY);
      const boxRight = Math.max(startX, currentX);
      const boxBottom = Math.max(startY, currentY);

      setMarqueeRect({
        left: boxLeft,
        top: boxTop,
        width: boxRight - boxLeft,
        height: boxBottom - boxTop,
      });

      const container = containerRef.current;
      if (!container) return;

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
        } else if (!isModifierDragRef.current) {
          // Plain drag without Cmd/Ctrl: rows outside rectangle are unselected live
          newSelection.delete(issueId);
        }
      });

      const nextIds = Array.from(newSelection.keys()).toSorted().join(",");
      if (nextIds !== prevSelectedIdsRef.current) {
        prevSelectedIdsRef.current = nextIds;
        handleSetSelection(Array.from(newSelection.values()));
      }
    },
    [containerRef, handleSetSelection]
  );

  // Auto-scroll logic when dragging near container boundaries
  const handleAutoScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !isDraggingRef.current) return;

    const rect = container.getBoundingClientRect();
    const pointer = lastPointerPosRef.current;
    if (!pointer) return;

    const EDGE_SIZE = 40;
    const MAX_SPEED = 12;
    let scrolled = false;

    if (pointer.y < rect.top + EDGE_SIZE && pointer.y >= rect.top - 10) {
      const intensity = Math.max(0, 1 - (pointer.y - rect.top) / EDGE_SIZE);
      container.scrollTop -= MAX_SPEED * intensity;
      scrolled = true;
    } else if (pointer.y > rect.bottom - EDGE_SIZE && pointer.y <= rect.bottom + 10) {
      const intensity = Math.max(0, 1 - (rect.bottom - pointer.y) / EDGE_SIZE);
      container.scrollTop += MAX_SPEED * intensity;
      scrolled = true;
    }

    if (scrolled) {
      updateSelectionAndMarquee(pointer.x, pointer.y);
    }

    if (isDraggingRef.current) {
      autoScrollRafRef.current = requestAnimationFrame(handleAutoScroll);
    }
  }, [containerRef, updateSelectionAndMarquee]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isGloballyDisabled) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Only primary left button
      if (e.button !== 0) return;
      // Do not activate on touch pointers to preserve native mobile gestures
      if (e.pointerType === "touch") return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Filter out clicks on interactive elements (buttons, links, inputs, drag handles)
      if (target.closest(NON_MARQUEE_SELECTORS)) return;

      const rowElement = target.closest<HTMLElement>("[data-issue-id]");
      const hasModifier = e.metaKey || e.ctrlKey;

      startPointRef.current = { x: e.clientX, y: e.clientY };
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      currentPointerIdRef.current = e.pointerId;
      isDraggingRef.current = false;
      hasPointerCaptureRef.current = false;
      isModifierDragRef.current = hasModifier;

      if (rowElement) {
        clickedIssueRef.current = {
          id: rowElement.getAttribute("data-issue-id") || "",
          groupId: rowElement.getAttribute("data-issue-group-id") || "",
        };
      } else {
        clickedIssueRef.current = null;
      }

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
        lastPointerPosRef.current = { x: moveEvent.clientX, y: moveEvent.clientY };

        const deltaX = moveEvent.clientX - startPointRef.current.x;
        const deltaY = moveEvent.clientY - startPointRef.current.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (!isDraggingRef.current) {
          if (distance >= DRAG_THRESHOLD) {
            isDraggingRef.current = true;
            setIsMarqueeActive(true);

            // Capture pointer on container so drag continues smoothly across window
            try {
              if (container.setPointerCapture && currentPointerIdRef.current !== null) {
                container.setPointerCapture(currentPointerIdRef.current);
                hasPointerCaptureRef.current = true;
              }
            } catch {
              // Ignore pointer capture error if unsupported
            }

            document.body.style.userSelect = "none";

            // Start auto-scroller loop
            if (autoScrollRafRef.current) cancelAnimationFrame(autoScrollRafRef.current);
            autoScrollRafRef.current = requestAnimationFrame(handleAutoScroll);
          } else {
            return;
          }
        }

        // Prevent default text selection while dragging marquee
        moveEvent.preventDefault();

        // Schedule RAF for smooth UI update & hit test
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = requestAnimationFrame(() => {
          updateSelectionAndMarquee(moveEvent.clientX, moveEvent.clientY);
        });
      };

      const handlePointerUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        if (hasPointerCaptureRef.current && currentPointerIdRef.current !== null) {
          try {
            container.releasePointerCapture(currentPointerIdRef.current);
          } catch {
            // Ignore error
          }
          hasPointerCaptureRef.current = false;
        }

        document.body.style.userSelect = "";
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
          // Finished marquee drag: suppress the subsequent click event
          suppressNextClickRef.current = true;
          setTimeout(() => {
            suppressNextClickRef.current = false;
          }, 200);

          isDraggingRef.current = false;
          setIsMarqueeActive(false);
          setMarqueeRect(null);
          startPointRef.current = null;
          clickedIssueRef.current = null;
        } else {
          // Distance was < DRAG_THRESHOLD: This is a CLICK!
          startPointRef.current = null;
          const clicked = clickedIssueRef.current;
          clickedIssueRef.current = null;

          if (clicked && clicked.id) {
            // Clicked on a neutral area of an issue row
            const isModifierClick = upEvent.metaKey || upEvent.ctrlKey || isModifierDragRef.current;
            if (upEvent.shiftKey) {
              // Shift click: select range
              selectionHelpers.handleEntityClick(upEvent as any, clicked.id, clicked.groupId);
            } else if (isModifierClick) {
              // Cmd/Ctrl click: toggle
              selectionHelpers.handleEntityClick(upEvent as any, clicked.id, clicked.groupId);
            } else {
              // Plain click on neutral row area: select ONLY this issue
              selectionHelpers.handleSelectOnly(clicked.id, clicked.groupId);
            }
          } else {
            // Clicked on empty list background (outside rows and interactive items)
            const upTarget = upEvent.target as HTMLElement | null;
            if (upTarget && !upTarget.closest("[data-issue-id]") && !upTarget.closest(NON_MARQUEE_SELECTORS)) {
              handleClearSelection();
            }
          }
        }
      };

      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    };

    container.addEventListener("pointerdown", handlePointerDown as EventListener, { capture: true });

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown as EventListener, { capture: true });
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
    selectionHelpers,
    updateSelectionAndMarquee,
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

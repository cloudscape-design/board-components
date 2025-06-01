// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ForwardedRef, forwardRef, KeyboardEvent, PointerEvent } from "react";
import clsx from "clsx";

import {
  InternalDragHandle,
  InternalDragHandleProps,
} from "@cloudscape-design/components/internal/do-not-use/drag-handle";

import { CLICK_DRAG_THRESHOLD, HandleActiveState } from "../item-container";

import styles from "./styles.css.js";
import testUtilsStyles from "./test-classes/styles.css.js";

export interface DragHandleProps {
  ariaLabelledBy: string;
  ariaDescribedBy: string;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  activeState: HandleActiveState;
  initialShowButtons?: boolean;
  onDirectionClick: InternalDragHandleProps["onDirectionClick"];
  dragHandleTooltipText?: string;
}

function DragHandle(
  {
    ariaLabelledBy,
    ariaDescribedBy,
    onPointerDown,
    onKeyDown,
    activeState,
    initialShowButtons,
    onDirectionClick,
    dragHandleTooltipText,
  }: DragHandleProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <InternalDragHandle
      ref={ref}
      className={clsx(
        styles.handle,
        activeState === "pointer" && styles.active,
        activeState === "uap" && testUtilsStyles["active-uap"],
      )}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedby={ariaDescribedBy}
      variant="drag-indicator"
      tooltipText={dragHandleTooltipText}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      directions={{
        "block-start": "active",
        "block-end": "active",
        "inline-start": "active",
        "inline-end": "active",
      }}
      triggerMode="keyboard-activate"
      onDirectionClick={onDirectionClick}
      initialShowButtons={initialShowButtons}
      hideButtonsOnDrag={true}
      clickDragThreshold={CLICK_DRAG_THRESHOLD}
    />
  );
}

export default forwardRef(DragHandle);

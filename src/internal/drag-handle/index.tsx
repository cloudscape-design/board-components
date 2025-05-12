// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ForwardedRef, forwardRef, KeyboardEvent, PointerEvent } from "react";
import clsx from "clsx";

import {
  InternalDragHandle,
  InternalDragHandleProps,
} from "@cloudscape-design/components/internal/do-not-use/drag-handle";

import styles from "./styles.css.js";

export interface DragHandleProps {
  ariaLabelledBy: string;
  ariaDescribedBy: string;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  isActivePointer: boolean;
  isActiveUap: boolean;
  showButtons?: boolean;
  onDirectionClick: InternalDragHandleProps["onDirectionClick"];
  dragHandleTooltipText?: string;
}

function DragHandle(
  {
    ariaLabelledBy,
    ariaDescribedBy,
    onPointerDown,
    onKeyDown,
    isActivePointer,
    isActiveUap,
    showButtons,
    onDirectionClick,
    dragHandleTooltipText,
  }: DragHandleProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <InternalDragHandle
      ref={ref}
      className={clsx(styles.handle, isActivePointer && styles.active, isActiveUap && styles["active-uap"])}
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
      interactionMode="controlled"
      onDirectionClick={onDirectionClick}
      showButtons={showButtons}
    />
  );
}

export default forwardRef(DragHandle);

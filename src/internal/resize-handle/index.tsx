// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { KeyboardEvent, PointerEvent } from "react";
import clsx from "clsx";

import InternalDragHandle, {
  DragHandleProps as InternalDragHandleProps,
} from "@cloudscape-design/components/internal/components/drag-handle";

import styles from "./styles.css.js";

export interface ResizeHandleProps {
  ariaLabelledBy: string;
  ariaDescribedBy: string;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  isActivePointer: boolean;
  isActiveUap: boolean;
  onDirectionClick: InternalDragHandleProps["onDirectionClick"];
  resizeHandleTooltipText?: string;
}

export default function ResizeHandle({
  ariaLabelledBy,
  ariaDescribedBy,
  onPointerDown,
  onKeyDown,
  isActivePointer,
  isActiveUap,
  onDirectionClick,
  resizeHandleTooltipText,
}: ResizeHandleProps) {
  return (
    <InternalDragHandle
      className={clsx(styles.handle, isActivePointer && styles.active, isActiveUap && styles["active-uap"])}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedby={ariaDescribedBy}
      variant="resize-area"
      tooltipText={resizeHandleTooltipText}
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
    />
  );
}

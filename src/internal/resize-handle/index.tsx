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
}

export default function ResizeHandle({
  ariaLabelledBy,
  ariaDescribedBy,
  onPointerDown,
  onKeyDown,
  isActivePointer,
  isActiveUap,
  onDirectionClick,
}: ResizeHandleProps) {
  return (
    <InternalDragHandle
      className={clsx(styles.handle, isActivePointer && styles.active, isActiveUap && styles["active-uap"])}
      ariaLabelledBy={ariaLabelledBy}
      ariaDescribedby={ariaDescribedBy}
      variant="resize-area"
      // Provide an arbitrary large value to valueMax since the editor can be
      // resized to be infinitely large.
      ariaValue={{ valueMin: 0, valueMax: 1000000, valueNow: 100 }}
      tooltipText={"Tooltip Text"}
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

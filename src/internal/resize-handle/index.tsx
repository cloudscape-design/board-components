// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { KeyboardEvent, PointerEvent } from "react";
import clsx from "clsx";

import {
  InternalDragHandle,
  InternalDragHandleProps,
} from "@cloudscape-design/components/internal/do-not-use/drag-handle";

import { CLICK_DRAG_THRESHOLD, HandleActiveState } from "../item-container";

import styles from "./styles.css.js";
import testUtilsStyles from "./test-classes/styles.css.js";

export interface ResizeHandleProps {
  ariaLabelledBy: string;
  ariaDescribedBy: string;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  activeState: HandleActiveState;
  onDirectionClick: InternalDragHandleProps["onDirectionClick"];
  resizeHandleTooltipText?: string;
}

export default function ResizeHandle({
  ariaLabelledBy,
  ariaDescribedBy,
  onPointerDown,
  onKeyDown,
  activeState,
  onDirectionClick,
  resizeHandleTooltipText,
}: ResizeHandleProps) {
  return (
    <InternalDragHandle
      className={clsx(
        styles.handle,
        activeState === "pointer" && styles.active,
        activeState === "uap" && testUtilsStyles["active-uap"],
      )}
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
      triggerMode="keyboard-activate"
      onDirectionClick={onDirectionClick}
      hideButtonsOnDrag={true}
      clickDragThreshold={CLICK_DRAG_THRESHOLD}
    />
  );
}

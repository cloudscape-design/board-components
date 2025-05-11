// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ForwardedRef, forwardRef, KeyboardEvent, PointerEvent } from "react";
import clsx from "clsx";

import Icon from "@cloudscape-design/components/icon";
import InternalDragHandle from "@cloudscape-design/components/internal/components/drag-handle";
import { DragHandleProps as InternalDragHandleProps } from "@cloudscape-design/components/internal/components/drag-handle";

import Handle from "../handle";

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
  }: DragHandleProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  return (
    <>
      <Handle
        ref={ref}
        className={clsx(styles.handle, isActivePointer && styles.active)}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      >
        <Icon name="drag-indicator" />
      </Handle>
      <InternalDragHandle
        ref={ref}
        className={clsx(styles.handle, isActivePointer && styles.active, isActiveUap && styles["active-uap"])}
        ariaLabelledBy={ariaLabelledBy}
        ariaDescribedby={ariaDescribedBy}
        variant="drag-indicator"
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
        showButtons={showButtons}
      />
    </>
  );
}

export default forwardRef(DragHandle);

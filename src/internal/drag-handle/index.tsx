// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ForwardedRef, forwardRef, KeyboardEvent, PointerEvent } from "react";
import clsx from "clsx";

import Icon from "@cloudscape-design/components/icon";

import Handle from "../handle";

import styles from "./styles.css.js";

export interface DragHandleProps {
  ariaLabelledBy: string;
  ariaDescribedBy: string;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  isActive: boolean;
}

function DragHandle(
  { ariaLabelledBy, ariaDescribedBy, onPointerDown, onKeyDown, isActive }: DragHandleProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <Handle
      ref={ref}
      className={clsx(styles.handle, isActive && styles.active)}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <Icon name="drag-indicator" />
    </Handle>
  );
}

export default forwardRef(DragHandle);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ForwardedRef, KeyboardEvent, PointerEvent, forwardRef } from "react";

import Handle from "../handle";
import DragHandleIcon from "./icon";
import styles from "./styles.css.js";

export interface DragHandleProps {
  ariaLabel: string;
  ariaDescribedBy: string;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

function DragHandle(
  { ariaLabel, ariaDescribedBy, onPointerDown, onKeyDown }: DragHandleProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <Handle
      ref={ref}
      className={styles.handle}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <DragHandleIcon />
    </Handle>
  );
}

export default forwardRef(DragHandle);

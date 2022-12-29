// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { KeyboardEvent, PointerEvent } from "react";
import Handle from "../handle";
import { ResizeHandleIcon } from "./icon";
import styles from "./styles.css.js";

export interface ResizeHandleProps {
  ariaLabel: string;
  ariaDescribedBy: string;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export default function ResizeHandle({ ariaLabel, ariaDescribedBy, onPointerDown, onKeyDown }: ResizeHandleProps) {
  return (
    <Handle
      className={styles.handle}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <ResizeHandleIcon />
    </Handle>
  );
}

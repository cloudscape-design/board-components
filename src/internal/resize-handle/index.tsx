// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { KeyboardEvent, PointerEvent } from "react";
import Handle from "../handle";
import { ResizeHandleIcon } from "./icon";
import styles from "./styles.css.js";

export interface ResizeHandleProps {
  ariaLabelledBy: string | undefined;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export default function ResizeHandle({ ariaLabelledBy, onPointerDown, onKeyDown }: ResizeHandleProps) {
  return (
    <Handle
      className={styles.handle}
      aria-labelledby={ariaLabelledBy}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <ResizeHandleIcon />
    </Handle>
  );
}

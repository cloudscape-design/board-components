// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { KeyboardEvent, PointerEvent } from "react";
import Handle from "../handle";
import { ResizeHandleIcon } from "./icon";
import styles from "./styles.css.js";

export interface ResizeHandleProps {
  ariaLabelledBy: string | undefined;
  ariaDescribedBy: string | undefined;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export default function ResizeHandle({ ariaLabelledBy, ariaDescribedBy, onPointerDown, onKeyDown }: ResizeHandleProps) {
  return (
    <Handle
      className={styles.handle}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <ResizeHandleIcon />
    </Handle>
  );
}

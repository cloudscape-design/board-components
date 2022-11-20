// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { MouseEvent } from "react";
import Handle from "../handle";
import { ResizeHandleIcon } from "./icon";
import styles from "./styles.css.js";

export interface ResizeHandleProps {
  ariaLabel: string | undefined;
  onResize: (event: MouseEvent) => void;
}

export default function ResizeHandle({ ariaLabel, onResize }: ResizeHandleProps) {
  return (
    <Handle className={styles.handle} aria-label={ariaLabel} onMouseDown={onResize}>
      <ResizeHandleIcon />
    </Handle>
  );
}

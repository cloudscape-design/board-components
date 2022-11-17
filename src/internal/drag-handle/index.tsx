// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ForwardedRef, MouseEvent, forwardRef } from "react";

import Handle from "../handle";
import DragHandleIcon from "./icon";
import styles from "./styles.css.js";

export interface DragHandleProps {
  ariaLabel?: string;
  onMouseDown: (event: MouseEvent) => void;
}

function DragHandle({ ariaLabel, onMouseDown }: DragHandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <Handle className={styles.handle} ref={ref} aria-label={ariaLabel} onMouseDown={onMouseDown}>
      <DragHandleIcon />
    </Handle>
  );
}

export default forwardRef(DragHandle);

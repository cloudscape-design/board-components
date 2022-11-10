// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DraggableSyntheticListeners } from "@dnd-kit/core";
import { ForwardedRef, forwardRef } from "react";

import Handle from "../handle";
import DragHandleIcon from "./icon";
import styles from "./styles.css.js";

export interface DragHandleProps {
  ariaLabel?: string;
  listeners: DraggableSyntheticListeners;
}

function DragHandle({ ariaLabel, listeners }: DragHandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <Handle className={styles.handle} ref={ref} aria-label={ariaLabel} {...listeners}>
      <DragHandleIcon />
    </Handle>
  );
}

export default forwardRef(DragHandle);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { forwardRef, ForwardedRef } from "react";

import Handle from "../handle";
import DragHandleIcon from "./icon";
import styles from "./styles.css.js";

export interface DragHandleProps {
  ariaLabel?: string;
}

function DragHandle({ ariaLabel }: DragHandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <Handle className={styles.handle} ref={ref} ariaLabel={ariaLabel}>
      <DragHandleIcon />
    </Handle>
  );
}

export default forwardRef(DragHandle);

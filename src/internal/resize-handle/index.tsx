// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { forwardRef, ForwardedRef } from "react";

import Handle from "../handle";
import { ResizeHandleIcon } from "./icon";
import styles from "./styles.css.js";

export interface ResizeHandleProps {
  ariaLabel?: string;
}

function ResizeHandle({ ariaLabel }: ResizeHandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <Handle className={styles.handle} aria-label={ariaLabel} ref={ref}>
      <ResizeHandleIcon />
    </Handle>
  );
}

export default forwardRef(ResizeHandle);

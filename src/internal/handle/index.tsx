// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { forwardRef, ForwardedRef } from "react";
import styles from "./styles.css.js";

export interface HandleProps {
  children?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

function Handle({ children, className, ariaLabel }: HandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <button className={clsx(styles.handle, className)} ref={ref} aria-label={ariaLabel}>
      {children}
    </button>
  );
}

export default forwardRef(Handle);

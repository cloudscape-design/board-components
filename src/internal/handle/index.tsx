// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { ForwardedRef } from "react";
import styles from "./styles.css.js";

export interface HandleProps {
  children?: React.ReactNode;
}

function Handle({ children }: HandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  const className = styles.handle;
  return (
    <button className={className} ref={ref}>
      {children}
    </button>
  );
}

export default React.forwardRef(Handle);

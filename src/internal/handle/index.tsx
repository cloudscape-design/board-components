// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { forwardRef, ForwardedRef, ButtonHTMLAttributes } from "react";
import styles from "./styles.css.js";

function Handle(props: ButtonHTMLAttributes<HTMLButtonElement>, ref: ForwardedRef<HTMLButtonElement>) {
  return <button {...props} className={clsx(styles.handle, props.className)} ref={ref} />;
}

export default forwardRef(Handle);

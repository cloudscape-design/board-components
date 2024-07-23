// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ButtonHTMLAttributes, ForwardedRef, forwardRef, PointerEvent } from "react";
import clsx from "clsx";

import styles from "./styles.css.js";

function Handle(props: ButtonHTMLAttributes<HTMLButtonElement>, ref: ForwardedRef<HTMLButtonElement>) {
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) {
      return;
    }
    props.onPointerDown?.(event);
  }

  return (
    <button {...props} onPointerDown={handlePointerDown} className={clsx(styles.handle, props.className)} ref={ref} />
  );
}

export default forwardRef(Handle);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ForwardedRef, forwardRef, HTMLAttributes, PointerEvent } from "react";
import clsx from "clsx";

import styles from "./styles.css.js";

function Handle(props: HTMLAttributes<HTMLElement>, ref: ForwardedRef<HTMLElement>) {
  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) {
      return;
    }
    props.onPointerDown?.(event);
  }

  return (
    <div
      {...props}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (event.key === " ") {
          event.preventDefault();
        }
      }}
      className={clsx(styles.handle, props.className)}
      ref={ref as any}
    />
  );
}

export default forwardRef(Handle);

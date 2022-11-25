// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { ReactNode, Ref, forwardRef } from "react";
import styles from "./styles.css.js";

export interface WidgetContainerHeaderProps {
  handle: ReactNode;
  children?: ReactNode;
  settings?: ReactNode;
}

export default forwardRef(WidgetContainerHeader);

function WidgetContainerHeader({ handle, children, settings }: WidgetContainerHeaderProps, ref: Ref<HTMLDivElement>) {
  return (
    <div ref={ref} className={styles.header}>
      <div className={clsx(styles.fixed, styles.handle)}>{handle}</div>
      <div className={clsx(styles.flexible, styles.children)}>{children}</div>
      {settings ? <div className={clsx(styles.fixed, styles.settings)}>{settings}</div> : null}
    </div>
  );
}

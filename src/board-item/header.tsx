// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";
import clsx from "clsx";

import { useVisualRefresh } from "../internal/base-component/use-visual-refresh.js";

import styles from "./styles.css.js";

export interface WidgetContainerHeaderProps {
  handle: ReactNode;
  children?: ReactNode;
  settings?: ReactNode;
}

export default function WidgetContainerHeader({ handle, children, settings }: WidgetContainerHeaderProps) {
  const isVisualRefresh = useVisualRefresh();
  return (
    <div className={clsx(styles.header, isVisualRefresh && styles.refresh)}>
      <div className={clsx(styles.fixed, styles.handle)}>{handle}</div>
      <div className={clsx(styles.flexible, styles["header-content"])}>{children}</div>
      {settings ? <div className={clsx(styles.fixed, styles.settings)}>{settings}</div> : null}
    </div>
  );
}

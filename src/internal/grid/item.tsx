// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import clsx from "clsx";
import { ReactNode, memo } from "react";
import { GridLayoutItem } from "../interfaces";
import styles from "./styles.css.js";

export interface GridItemProps {
  item: GridLayoutItem;
  children?: ReactNode;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

const GridItem = ({ children, item, contentClassName, contentStyle }: GridItemProps) => {
  // Grid row start can not be set as part of a CSS class names, since we have a potentially infinite height grid.
  return (
    <div
      data-column-span={item.width}
      data-row-span={item.height}
      data-column-offset={item.x + 1}
      data-row-offset={item.y + 1}
      className={styles.grid__item}
      style={{ gridRowStart: item.y + 1, gridRowEnd: `span ${item.height}` }}
    >
      <div className={clsx(styles.grid__item__content, contentClassName)} style={contentStyle}>
        {children}
      </div>
    </div>
  );
};

export default memo(GridItem);

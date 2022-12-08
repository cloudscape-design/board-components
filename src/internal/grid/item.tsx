// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode, memo } from "react";
import { GridLayoutItem } from "../interfaces";
import styles from "./styles.css.js";

export interface GridItemProps {
  item: GridLayoutItem;
  children?: ReactNode;
}

const GridItem = ({ children, item }: GridItemProps) => {
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
      {children}
    </div>
  );
};

export default memo(GridItem);

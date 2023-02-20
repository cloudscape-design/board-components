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
      className={styles.grid__item}
      style={{
        gridRowStart: item.y + 1,
        gridRowEnd: `span ${item.height}`,
        gridColumnStart: item.x + 1,
        gridColumnEnd: `span ${item.width}`,
      }}
    >
      {children}
    </div>
  );
};

export default memo(GridItem);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode, memo } from "react";
import { GridLayoutItem } from "../interfaces";
import styles from "./styles.css.js";

export interface GridItemProps {
  item: GridLayoutItem;
  children?: ReactNode;
}

const GridItem = (props: GridItemProps) => {
  const { children, item } = props;
  const className = styles.grid__item;

  const data = {
    "data-column-span": item.width,
    "data-row-span": item.height,
    "data-column-offset": item.x + 1,
    "data-row-offset": item.y + 1,
  };

  // Grid row start can not be set as part of a CSS class names,
  // since we have a potential infinite height grid.
  return (
    <div {...data} className={className} style={{ gridRowStart: item.y + 1, gridRowEnd: `span ${item.height}` }}>
      {children}
    </div>
  );
};

export default memo(GridItem);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from "react";

import { GridLayoutItem } from "./interfaces";
import styles from "./styles.css.js";

export interface GridItemProps extends GridLayoutItem {
  children?: React.ReactNode;
}

const GridItem = (props: GridItemProps) => {
  const { children, columnSpan, rowSpan, columnOffset, rowOffset } = props;
  const className = styles.grid__item;

  const data = {
    "data-column-span": columnSpan,
    "data-row-span": rowSpan,
    "data-column-offset": columnOffset,
    "data-row-offset": rowOffset,
  };

  // Grid row start can not be set as part of a CSS class names,
  // since we have an potential infinite height grid.
  return (
    <div {...data} className={className} style={{ gridRowStart: rowOffset }}>
      {children}
    </div>
  );
};

export default React.memo(GridItem);

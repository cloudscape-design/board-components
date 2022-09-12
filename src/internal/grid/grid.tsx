// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from "react";

import { GridLayoutItem, GridProps } from "./interfaces";
import styles from "./styles.css.js";
import { zipTwoArrays } from "./utils";

import GridItem from "./item";

function Grid({ layout, children, columns }: GridProps, ref: React.ForwardedRef<HTMLDivElement>) {
  const zipped = zipTwoArrays<GridLayoutItem, React.ReactNode>(layout, React.Children.toArray(children));
  const data = {
    "data-columns": columns,
  };

  return (
    <div {...data} className={styles.grid} ref={ref}>
      {zipped.map(([item, children]) => (
        <GridItem key={item.id} {...item}>
          {children}
        </GridItem>
      ))}
    </div>
  );
}

export default React.forwardRef(Grid);

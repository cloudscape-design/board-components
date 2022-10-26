// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from "react";

import { GridProps } from "./interfaces";
import styles from "./styles.css.js";
import { zipTwoArrays } from "./utils";
import { GridLayoutItem } from "../../layout";
import GridItem from "./item";

export default function Grid({ layout, children, columns, rows }: GridProps) {
  const zipped = zipTwoArrays<GridLayoutItem, React.ReactNode>(layout, React.Children.toArray(children));
  return (
    <div data-columns={columns} data-rows={rows} className={styles.grid}>
      {zipped.map(([item, children]) => (
        <GridItem key={item.id} {...item}>
          {children}
        </GridItem>
      ))}
    </div>
  );
}

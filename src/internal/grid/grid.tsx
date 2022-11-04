// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode, Children } from "react";

import { GridLayoutItem } from "../layout";
import { GridProps } from "./interfaces";
import GridItem from "./item";
import styles from "./styles.css.js";
import { zipTwoArrays } from "./utils";

export default function Grid({ layout, children, columns, rows }: GridProps) {
  const zipped = zipTwoArrays<GridLayoutItem, ReactNode>(layout, Children.toArray(children));
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

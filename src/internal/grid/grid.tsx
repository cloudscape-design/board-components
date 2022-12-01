// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Children } from "react";
import { GAP, ROWSPAN_HEIGHT } from "../constants";
import { GridContextProvider } from "../grid-context";

import { GridProps } from "./interfaces";
import GridItem from "./item";
import styles from "./styles.css.js";
import { zipTwoArrays } from "./utils";

export default function Grid({ layout, children, columns, rows }: GridProps) {
  const [gridWidth, containerQueryRef] = useContainerQuery((entry) => entry.contentBoxWidth, []);
  const zipped = zipTwoArrays(layout, Children.toArray(children));

  return (
    <GridContextProvider
      value={{
        columns,
        getWidth: (colspan: number) => {
          const cellWidth = ((gridWidth || 0) - (columns - 1) * GAP) / columns;
          return colspan * cellWidth + (colspan - 1) * GAP;
        },
        getHeight: (rowspan: number) => rowspan * ROWSPAN_HEIGHT + (rowspan - 1) * GAP,
      }}
    >
      <div ref={containerQueryRef} data-columns={columns} data-rows={rows} className={styles.grid}>
        {zipped.map(([item, children]) => (
          <GridItem key={item.id} item={item}>
            {children}
          </GridItem>
        ))}
      </div>
    </GridContextProvider>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Children, useMemo } from "react";
import { GridContextProvider } from "../grid-context";

import { GridProps } from "./interfaces";
import GridItem from "./item";
import styles from "./styles.css.js";
import { zipTwoArrays } from "./utils";

const GRID_GAP = 16;
const ROWSPAN_HEIGHT = 100;

export default function Grid({ layout, children, columns, rows }: GridProps) {
  const [gridWidth, containerQueryRef] = useContainerQuery((entry) => entry.contentBoxWidth, []);
  const zipped = zipTwoArrays(layout, Children.toArray(children));

  const context = useMemo(() => {
    const getWidth = (colspan: number) => {
      colspan = Math.min(columns, colspan);
      const cellWidth = ((gridWidth || 0) - (columns - 1) * GRID_GAP) / columns;
      return colspan * cellWidth + (colspan - 1) * GRID_GAP;
    };
    const getHeight = (rowspan: number) => rowspan * ROWSPAN_HEIGHT + (rowspan - 1) * GRID_GAP;
    const getColOffset = (x: number) => getWidth(x) + GRID_GAP;
    const getRowOffset = (y: number) => getHeight(y) + GRID_GAP;

    return { getWidth, getHeight, getColOffset, getRowOffset };
  }, [columns, gridWidth]);

  return (
    <GridContextProvider value={context}>
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

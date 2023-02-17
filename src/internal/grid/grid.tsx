// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Children } from "react";
import { GridContextProvider } from "../grid-context";
import { adjustColumnSpanForColumns } from "../utils/layout";
import { zipTwoArrays } from "../utils/zip-arrays";

import { GridProps } from "./interfaces";
import GridItem from "./item";
import styles from "./styles.css.js";

/* Matches grid gap in CSS. */
const GRID_GAP = 16;
/* Matches grid-auto-rows in CSS. */
const ROWSPAN_HEIGHT = 100;

export default function Grid({ layout, children, columns, rows }: GridProps) {
  const [gridWidth, containerQueryRef] = useContainerQuery((entry) => entry.contentBoxWidth, []);
  const zipped = zipTwoArrays(layout, Children.toArray(children));

  // The below getters translate relative grid units into size/offset values in pixels.
  const getWidth = (colspan: number) => {
    colspan = adjustColumnSpanForColumns(columns, colspan);
    const cellWidth = ((gridWidth || 0) - (columns - 1) * GRID_GAP) / columns;
    return colspan * cellWidth + (colspan - 1) * GRID_GAP;
  };
  const getHeight = (rowspan: number) => rowspan * ROWSPAN_HEIGHT + (rowspan - 1) * GRID_GAP;
  const getColOffset = (x: number) => getWidth(x) + GRID_GAP;
  const getRowOffset = (y: number) => getHeight(y) + GRID_GAP;

  return (
    <GridContextProvider value={{ getWidth, getHeight, getColOffset, getRowOffset }}>
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

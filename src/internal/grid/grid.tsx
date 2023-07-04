// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { Children, useRef } from "react";
import { useMergeRefs } from "../utils/use-merge-refs";
import { zipTwoArrays } from "../utils/zip-arrays";

import { GridProps } from "./interfaces";
import GridItem from "./item";
import styles from "./styles.css.js";
import { useDensityMode } from "./use-density-mode";

/* Matches grid gap in CSS. */
const GRID_GAP = {
  comfortable: 20,
  compact: 16,
};

/* Matches grid-auto-rows in CSS. */
const ROWSPAN_HEIGHT = {
  comfortable: 96,
  compact: 76,
};

export default function Grid({ layout, children: render, columns }: GridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridWidth, containerQueryRef] = useContainerQuery((entry) => entry.contentBoxWidth, []);
  const densityMode = useDensityMode(gridRef);
  const gridGap = GRID_GAP[densityMode];
  const rowspanHeight = ROWSPAN_HEIGHT[densityMode];

  // The below getters translate relative grid units into size/offset values in pixels.
  const getWidth = (colspan: number) => {
    colspan = Math.min(columns, colspan);
    const cellWidth = ((gridWidth || 0) - (columns - 1) * gridGap) / columns;
    return colspan * cellWidth + (colspan - 1) * gridGap;
  };
  const getHeight = (rowspan: number) => rowspan * rowspanHeight + (rowspan - 1) * gridGap;
  const getColOffset = (x: number) => getWidth(x) + gridGap;
  const getRowOffset = (y: number) => getHeight(y) + gridGap;

  const gridContext = { getWidth, getHeight, getColOffset, getRowOffset };
  const children = render?.(gridContext);

  const zipped = zipTwoArrays(layout, Children.toArray(children));

  const ref = useMergeRefs(gridRef, containerQueryRef);
  return (
    <div ref={ref} className={clsx(styles.grid, styles[`columns-${columns}`])}>
      {zipped.map(([item, children]) => (
        <GridItem key={item.id} item={item}>
          {children}
        </GridItem>
      ))}
    </div>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Children, Ref, forwardRef, useImperativeHandle } from "react";
import { ScaleProps } from "../interfaces";

import { GridProps } from "./interfaces";
import GridItem from "./item";
import styles from "./styles.css.js";
import { zipTwoArrays } from "./utils";

const GRID_GAP = 16;
const ROWSPAN_HEIGHT = 260;

export interface GridRef {
  scaleProps: ScaleProps;
}

export default forwardRef(Grid);

function Grid({ layout, children, columns, rows, width }: GridProps, ref: Ref<GridRef>) {
  const zipped = zipTwoArrays(layout, Children.toArray(children));

  useImperativeHandle(ref, () => {
    const cellWidth = (width - (columns - 1) * GRID_GAP) / columns;
    const getWidth = (colspan: number) => colspan * cellWidth + (colspan - 1) * GRID_GAP;
    const getHeight = (rowspan: number) => rowspan * ROWSPAN_HEIGHT + (rowspan - 1) * GRID_GAP;
    const getColOffset = (x: number) => getWidth(x) + GRID_GAP;
    const getRowOffset = (y: number) => getHeight(y) + GRID_GAP;
    return {
      scaleProps: {
        size: ({ width, height }) => ({ width: getWidth(width), height: getHeight(height) }),
        offset: ({ x, y }) => ({ x: getColOffset(x), y: getRowOffset(y) }),
      },
    };
  });

  return (
    <div data-columns={columns} data-rows={rows} className={styles.grid}>
      {zipped.map(([item, children]) => (
        <GridItem key={item.id} item={item}>
          {children}
        </GridItem>
      ))}
    </div>
  );
}

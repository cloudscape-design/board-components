// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Children } from "react";
import { GridContextProvider } from "../grid-context";
import { zipTwoArrays } from "../utils/zip-arrays";

import { GridProps } from "./interfaces";
import GridItem from "./item";
import styles from "./styles.css.js";

/* Matches grid gap in CSS. */
const GRID_GAP = 16;
/* Matches grid-auto-rows in CSS. */
const ROWSPAN_HEIGHT = 100;

export default function Grid({ layout, children, columns, rows, transforms, inTransition }: GridProps) {
  const [gridWidth, containerQueryRef] = useContainerQuery((entry) => entry.contentBoxWidth, []);
  const zipped = zipTwoArrays(layout, Children.toArray(children));

  // The below getters translate relative grid units into size/offset values in pixels.
  const getWidth = (colspan: number) => {
    colspan = Math.min(columns, colspan);
    const cellWidth = ((gridWidth || 0) - (columns - 1) * GRID_GAP) / columns;
    return colspan * cellWidth + (colspan - 1) * GRID_GAP;
  };
  const getHeight = (rowspan: number) => rowspan * ROWSPAN_HEIGHT + (rowspan - 1) * GRID_GAP;
  const getColOffset = (x: number) => getWidth(x) + GRID_GAP;
  const getRowOffset = (y: number) => getHeight(y) + GRID_GAP;

  return (
    <GridContextProvider value={{ getWidth, getHeight }}>
      <div ref={containerQueryRef} data-columns={columns} data-rows={rows} className={styles.grid}>
        {zipped.map(([item, children]) => {
          const contentTransform = transforms?.[item.id];
          const contentClassNames: string[] = [];
          const contentStyle: React.CSSProperties = {};

          // When there is an active transition grid items use animations.
          if (inTransition) {
            contentClassNames.push(styles["in-transition"]);
          }
          // The moved items positions are altered with CSS transform.
          if (contentTransform?.type === "move") {
            contentClassNames.push(styles.transformed);
            contentStyle.transform = CSSUtil.Transform.toString({
              x: getColOffset(contentTransform.x),
              y: getRowOffset(contentTransform.y),
              scaleX: 1,
              scaleY: 1,
            });
            contentStyle.width = getWidth(contentTransform.width) + "px";
            contentStyle.height = getHeight(contentTransform.height) + "px";
          }
          // The item is removed from the DOM after animations play.
          // During the animations the removed item is hidden with styles.
          if (contentTransform?.type === "remove") {
            contentClassNames.push(styles.removed);
          }

          return (
            <GridItem key={item.id} item={item} contentClassName={clsx(contentClassNames)} contentStyle={contentStyle}>
              {children}
            </GridItem>
          );
        })}
      </div>
    </GridContextProvider>
  );
}

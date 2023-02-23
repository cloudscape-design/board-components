// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { useRef } from "react";
import { MIN_COLUMN_SPAN } from "../internal/constants";
import { useDroppable } from "../internal/dnd-controller/controller";
import { GridContext } from "../internal/grid/interfaces";
import styles from "./styles.css.js";

export type PlaceholderState = "default" | "active" | "hover";

export interface PlaceholderProps {
  id: string;
  state: PlaceholderState;
  gridContext: GridContext;
  columns: number;
}

export default function Placeholder({ id, state, gridContext, columns }: PlaceholderProps) {
  const ref = useRef<HTMLDivElement>(null);

  const dropTargetContext = {
    scale: ({ width, height }: { width: number; height: number }) => ({
      width: gridContext.getWidth(Math.round((width * columns) / 100) || MIN_COLUMN_SPAN),
      height: gridContext.getHeight(height),
    }),
  };

  useDroppable({ itemId: id, context: dropTargetContext, getElement: () => ref.current! });

  return <div ref={ref} className={clsx(styles.placeholder, styles[`placeholder--${state}`])} />;
}

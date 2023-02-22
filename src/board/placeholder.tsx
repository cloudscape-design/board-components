// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { useRef } from "react";
import { MIN_COLUMN_SPAN } from "../internal/constants";
import { useDroppable } from "../internal/dnd-controller/controller";
import { useGridContext } from "../internal/grid-context";
import styles from "./styles.css.js";

export type PlaceholderState = "default" | "active" | "hover";

export interface PlaceholderProps {
  id: string;
  state: PlaceholderState;
  columns: number;
}

export default function Placeholder({ id, state, columns }: PlaceholderProps) {
  const gridContext = useGridContext();

  if (!gridContext) {
    throw new Error("Invariant violation: droppable is used outside grid context.");
  }

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

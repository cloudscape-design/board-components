// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { useRef } from "react";
import { useDroppable } from "../internal/dnd-controller/controller";
import { GridContext } from "../internal/grid/interfaces";
import { BoardItem } from "../internal/interfaces";
import { getItemDefaultColumnSpan, getItemDefaultRowSpan } from "../internal/utils/layout";
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
    scale: (item: BoardItem<unknown>, size?: { width: number; height: number }) => {
      const width = size?.width ?? getItemDefaultColumnSpan(item, columns);
      const height = size?.height ?? getItemDefaultRowSpan(item);
      return {
        width: gridContext.getWidth(width),
        height: gridContext.getHeight(height),
      };
    },
  };

  useDroppable({ itemId: id, context: dropTargetContext, getElement: () => ref.current! });

  return <div ref={ref} className={clsx(styles.placeholder, styles[`placeholder--${state}`])} />;
}

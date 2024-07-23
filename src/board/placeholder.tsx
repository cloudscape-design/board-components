// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useRef } from "react";
import clsx from "clsx";

import { useDroppable } from "../internal/dnd-controller/controller";
import { GridContext } from "../internal/grid/interfaces";
import { BoardItemDefinitionBase } from "../internal/interfaces";
import { getDefaultColumnSpan, getDefaultRowSpan } from "../internal/utils/layout";

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
    scale: (item: BoardItemDefinitionBase<unknown>, size?: { width: number; height: number }) => {
      const width = size?.width ?? getDefaultColumnSpan(item, columns);
      const height = size?.height ?? getDefaultRowSpan(item);
      return {
        width: gridContext.getWidth(width),
        height: gridContext.getHeight(height),
      };
    },
  };

  useDroppable({ itemId: id, context: dropTargetContext, getElement: () => ref.current! });

  return <div ref={ref} className={clsx(styles.placeholder, styles[`placeholder--${state}`])} />;
}

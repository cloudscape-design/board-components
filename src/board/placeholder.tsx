// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import React, { useRef } from "react";
import { useDroppable } from "../internal/dnd-controller/controller";
import { useGridContext } from "../internal/grid-context";
import styles from "./styles.css.js";

export type PlaceholderState = "default" | "active" | "hover";

export interface PlaceholderProps {
  id: string;
  state: PlaceholderState;
  acquire: () => void;
}

export default function Placeholder({ id, state, acquire }: PlaceholderProps) {
  const gridContext = useGridContext();
  if (!gridContext) {
    throw new Error("Invariant violation: droppable is used outside grid context.");
  }

  const ref = useRef<HTMLDivElement>(null);

  const dropTargetContext = {
    scale: ({ width, height }: { width: number; height: number }) => ({
      width: gridContext.getWidth(width),
      height: gridContext.getHeight(height),
    }),
    acquire,
  };

  useDroppable({ itemId: id, context: dropTargetContext, getElement: () => ref.current! });

  return <div ref={ref} className={clsx(styles.placeholder, styles[`placeholder--${state}`])} />;
}

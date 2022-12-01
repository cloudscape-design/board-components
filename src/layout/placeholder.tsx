// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { useDroppable } from "../internal/dnd-controller";
import { useGridContext } from "../internal/grid-context";
import styles from "./styles.css.js";

export type PlaceholderState = "default" | "active" | "hover";

export interface PlaceholderProps {
  state: PlaceholderState;
  id: string;
}

export default function Placeholder({ id, state }: PlaceholderProps) {
  const gridContext = useGridContext();
  if (!gridContext) {
    throw new Error("Invariant violation: droppable is used outside grid context.");
  }
  const scale = ({ width, height }: { width: number; height: number }) => ({
    width: gridContext.getWidth(width),
    height: gridContext.getHeight(height),
  });
  const ref = useDroppable(id, scale);
  return <div ref={ref} className={clsx(styles.placeholder, styles[`placeholder--${state}`])} />;
}

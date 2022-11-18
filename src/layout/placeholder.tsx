// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { useDroppable } from "../internal/dnd";
import styles from "./styles.css.js";

export type PlaceholderState = "default" | "active" | "hover";

export interface PlaceholderProps {
  state: PlaceholderState;
  id: string;
}

export default function Placeholder({ id, state }: PlaceholderProps) {
  const ref = useDroppable(id);
  return <div ref={ref} className={clsx(styles.placeholder, styles[`placeholder--${state}`])} />;
}

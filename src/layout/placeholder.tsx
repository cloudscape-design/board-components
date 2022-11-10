// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import styles from "./styles.css.js";

export type PlaceholderState = "default" | "active" | "hover";

export interface PlaceholderProps {
  state: PlaceholderState;
  id: string;
}

export default function Placeholder({ id, state }: PlaceholderProps) {
  const { setNodeRef: setDropRef } = useDroppable({ id });
  return <div ref={setDropRef} className={clsx(styles.placeholder, styles[`placeholder--${state}`])} />;
}

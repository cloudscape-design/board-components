// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import { useRef } from "react";
import { useDroppable } from "../internal/dnd-controller";
import styles from "./styles.css.js";

export type PlaceholderState = "default" | "active" | "hover";

export interface PlaceholderProps {
  state: PlaceholderState;
  id: string;
}

export default function Placeholder({ id, state }: PlaceholderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const getElementRef = useRef(() => ref.current!);

  useDroppable({ itemId: id, getElement: getElementRef.current });

  return <div ref={ref} className={clsx(styles.placeholder, styles[`placeholder--${state}`])} />;
}

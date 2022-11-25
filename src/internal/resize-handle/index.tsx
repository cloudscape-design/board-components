// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Handle from "../handle";
import { Coordinates } from "../interfaces";
import { ResizeHandleIcon } from "./icon";
import styles from "./styles.css.js";

export interface ResizeHandleProps {
  ariaLabel: string | undefined;
  onPointerDown: (coordinates: Coordinates) => void;
}

export default function ResizeHandle({ ariaLabel, onPointerDown }: ResizeHandleProps) {
  return (
    <Handle
      className={styles.handle}
      aria-label={ariaLabel}
      onPointerDown={(event) => onPointerDown({ pageX: event.pageX, pageY: event.pageY })}
    >
      <ResizeHandleIcon />
    </Handle>
  );
}

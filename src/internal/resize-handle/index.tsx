// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { KeyboardEvent } from "react";
import Handle from "../handle";
import { Coordinates } from "../interfaces";
import { getCoordinates } from "../utils/get-coordinates";
import { ResizeHandleIcon } from "./icon";
import styles from "./styles.css.js";

export interface ResizeHandleProps {
  ariaLabel: string | undefined;
  onPointerDown: (coordinates: Coordinates) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export default function ResizeHandle({ ariaLabel, onPointerDown, onKeyDown }: ResizeHandleProps) {
  return (
    <Handle
      className={styles.handle}
      aria-label={ariaLabel}
      onPointerDown={(event) => onPointerDown(getCoordinates(event))}
      onKeyDown={onKeyDown}
    >
      <ResizeHandleIcon />
    </Handle>
  );
}

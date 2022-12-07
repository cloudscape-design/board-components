// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ForwardedRef, KeyboardEvent, forwardRef } from "react";

import Handle from "../handle";
import { Coordinates } from "../interfaces";
import { getCoordinates } from "../utils/get-coordinates";
import DragHandleIcon from "./icon";
import styles from "./styles.css.js";

export interface DragHandleProps {
  ariaLabel?: string;
  onPointerDown: (coordinates: Coordinates) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

function DragHandle({ ariaLabel, onPointerDown, onKeyDown }: DragHandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <Handle
      className={styles.handle}
      ref={ref}
      aria-label={ariaLabel}
      onPointerDown={(event) => onPointerDown(getCoordinates(event))}
      onKeyDown={onKeyDown}
    >
      <DragHandleIcon />
    </Handle>
  );
}

export default forwardRef(DragHandle);

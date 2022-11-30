// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ForwardedRef, forwardRef } from "react";

import Handle from "../handle";
import { Coordinates } from "../interfaces";
import { getCoordinates } from "../utils/get-coordinates";
import DragHandleIcon from "./icon";
import styles from "./styles.css.js";

export interface DragHandleProps {
  ariaLabel?: string;
  onPointerDown: (coordinates: Coordinates) => void;
}

function DragHandle({ ariaLabel, onPointerDown }: DragHandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <Handle
      className={styles.handle}
      ref={ref}
      aria-label={ariaLabel}
      onPointerDown={(event) => onPointerDown(getCoordinates(event))}
    >
      <DragHandleIcon />
    </Handle>
  );
}

export default forwardRef(DragHandle);

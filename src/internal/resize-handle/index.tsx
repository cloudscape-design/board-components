// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Icon } from "@cloudscape-design/components";
import clsx from "clsx";
import { KeyboardEvent, PointerEvent } from "react";
import Handle from "../handle";
import styles from "./styles.css.js";

export interface ResizeHandleProps {
  ariaLabelledBy: string;
  ariaDescribedBy: string;
  onPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  isActive: boolean;
}

export default function ResizeHandle({
  ariaLabelledBy,
  ariaDescribedBy,
  onPointerDown,
  onKeyDown,
  isActive,
}: ResizeHandleProps) {
  return (
    <Handle
      className={clsx(styles.handle, isActive && styles.active)}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <Icon name="resize-area" />
    </Handle>
  );
}

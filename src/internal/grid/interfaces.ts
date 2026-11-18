// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";

import { GridLayoutItem } from "../interfaces";

export interface GridProps {
  layout: GridLayoutItem[];
  columns: number;
  children?: (context: GridContext) => ReactNode;
  isRtl?: () => boolean;
  /**
   * Overrides the default height (in pixels) of a single grid row. When not set, the
   * density-based default is used (96px in comfortable mode, 76px in compact mode).
   * Values that are not positive finite numbers are ignored and the default is used.
   */
  rowHeight?: number;
}

export interface GridContext {
  getWidth: (colspan: number) => number;
  getHeight: (rowspan: number) => number;
  getColOffset: (x: number) => number;
  getRowOffset: (y: number) => number;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";
import { GridLayoutItem } from "../interfaces";

export interface GridProps {
  layout: GridLayoutItem[];
  columns: number;
  children?: (context: GridContext) => ReactNode;
  isRtl?: boolean;
}

export interface GridContext {
  getWidth: (colspan: number) => number;
  getHeight: (rowspan: number) => number;
  getColOffset: (x: number) => number;
  getRowOffset: (y: number) => number;
}

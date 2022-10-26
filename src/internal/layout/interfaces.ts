// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataFallbackType, ItemBase } from "../../interfaces";

export interface LayoutItem {
  id: string;
  x: number;
  y: number;
  width: number;
}

export interface GridLayoutItem {
  id: string;
  columnSpan: number;
  rowSpan: number;
  columnOffset: number;
  rowOffset: number;
}

export interface CanvasLayoutItem<D = DataFallbackType> extends ItemBase<D> {
  columnOffset: number;
  rowSpan: number;
  columnSpan: number;
}

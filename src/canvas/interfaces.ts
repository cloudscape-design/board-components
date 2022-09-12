// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ItemBase, DataFallbackType } from "../interfaces";

export interface CanvasItem<D = DataFallbackType> extends ItemBase<D> {
  columnOffset: number;
  rowSpan: number;
  columnSpan: number;
}

export interface CanvasProps<D = DataFallbackType> {
  items: CanvasItem<D>[];
  renderItem(item: CanvasItem<D>): React.ReactNode;
}

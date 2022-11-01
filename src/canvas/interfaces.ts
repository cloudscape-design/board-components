// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DataFallbackType } from "../interfaces";
import { CanvasLayoutItem } from "../internal/layout";

export interface CanvasProps<D = DataFallbackType> {
  items: readonly CanvasLayoutItem<D>[];
  renderItem(item: CanvasLayoutItem<D>): React.ReactNode;
}

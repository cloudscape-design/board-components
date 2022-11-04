// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export type DataFallbackType = Record<string, unknown>;

export interface ItemDefinition {
  minRowSpan?: number;
  minColumnSpan?: number;
  defaultRowSpan: number;
  defaultColumnSpan: number;
}

export interface ItemBase<D = DataFallbackType> {
  id: string;
  definition: ItemDefinition;
  data: D;
}

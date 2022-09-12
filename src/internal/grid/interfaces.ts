// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export interface GridLayoutItem {
  id: string;
  columnSpan: number;
  rowSpan: number;
  columnOffset: number;
  rowOffset: number;
}

export interface GridProps {
  layout: GridLayoutItem[];
  columns: number;
  children?: React.ReactNode;
}

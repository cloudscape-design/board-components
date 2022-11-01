// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem } from "./interfaces";

export function createGridPlaceholders(rows: number, columns: number): readonly GridLayoutItem[] {
  const result: GridLayoutItem[] = [];

  for (let rowOffset = 1; rowOffset <= rows; rowOffset++) {
    for (let columnOffset = 1; columnOffset <= columns; columnOffset++) {
      result.push({
        id: `${rowOffset}-${columnOffset}}`,
        rowOffset,
        columnOffset,
        rowSpan: 1,
        columnSpan: 1,
      });
    }
  }

  return result;
}

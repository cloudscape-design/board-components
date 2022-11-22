// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayout } from "../interfaces";
import { GridMatrix } from "./interfaces";

export function toMatrix({ items, columns }: GridLayout): GridMatrix {
  const matrix: GridMatrix = [];

  for (const item of items) {
    for (let y = item.y; y < item.y + item.height; y++) {
      while (matrix.length <= y) {
        matrix.push([...Array(columns)].map(() => " "));
      }

      for (let x = item.x; x < item.x + item.width; x++) {
        const newValue = matrix[y][x] === " " ? item.id : matrix[y][x] + "/" + item.id;
        matrix[y][x] = newValue.split("/").sort().join("/");
      }
    }
  }

  return matrix;
}

export function toString(input: GridLayout | GridMatrix): string {
  const matrix = Array.isArray(input) ? input : toMatrix(input);
  return matrix.map((row) => row.join("\t")).join("\n");
}

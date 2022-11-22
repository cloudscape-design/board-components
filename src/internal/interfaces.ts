// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Represents a point on a screen.
export interface Coordinates {
  pageX: number;
  pageY: number;
}

// Represents a point in the grid.
export interface Position {
  x: number;
  y: number;
}

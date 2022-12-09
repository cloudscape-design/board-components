// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class Position {
  readonly __type = "Position";
  readonly x: number;
  readonly y: number;

  constructor({ x, y }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }
}

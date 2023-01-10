// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";
import { GridLayoutItem, ItemId, Transform } from "../interfaces";

export interface GridProps {
  layout: GridLayoutItem[];
  columns: number;
  rows: number;
  transforms?: { [id: ItemId]: Transform };
  children?: ReactNode;
}

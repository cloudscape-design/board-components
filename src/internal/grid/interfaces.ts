// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem } from "../layout";

export interface GridProps {
  layout: GridLayoutItem[];
  columns: number;
  rows: number;
  children?: React.ReactNode;
}

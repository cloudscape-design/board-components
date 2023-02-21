// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BoardProps } from "../../lib/components";

export function createItemsBreakpoints<T>(defaultItems: BoardProps.Item<T>[]): BoardProps.Items<T> {
  return { xs: defaultItems, m: defaultItems, xl: defaultItems, default: defaultItems };
}

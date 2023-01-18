// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { ItemsPaletteProps } from "./interfaces";
import { InternalItemsPalette } from "./internal";

export type { ItemsPaletteProps };

export default function ItemsPalette<DataType>(props: ItemsPaletteProps<DataType>) {
  return <InternalItemsPalette {...props} />;
}

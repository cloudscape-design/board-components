// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import useBaseComponent from "../internal/base-component/use-base-component";
import type { ItemsPaletteProps } from "./interfaces";
import { InternalItemsPalette } from "./internal";

export type { ItemsPaletteProps };

export default function ItemsPalette<DataType>(props: ItemsPaletteProps<DataType>) {
  const baseComponentProps = useBaseComponent("ItemsPalette");
  return <InternalItemsPalette {...props} {...baseComponentProps} />;
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { HTMLAttributes, Ref } from "react";
import { DataFallbackType } from "../interfaces";
import { CanvasLayoutItem } from "../internal/layout";

// TODO: remove this context argument and integrate this info into WidgetContainer
export interface ItemContext {
  ref: Ref<any>;
  props: HTMLAttributes<HTMLElement>;
  isDragging: boolean;
}

export interface CanvasProps<D = DataFallbackType> {
  items: readonly CanvasProps.Item<D>[];
  renderItem(item: CanvasProps.Item<D>, context: ItemContext): JSX.Element;
  onItemsChange: (event: CustomEvent<CanvasProps.ItemsChangeDetail<D>>) => void;
}

export namespace CanvasProps {
  export type Item<D> = CanvasLayoutItem<D>;

  export interface ItemsChangeDetail<D = DataFallbackType> {
    items: ReadonlyArray<Item<D>>;
  }
}

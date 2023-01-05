// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Ref, memo } from "react";
import { DashboardItem, Direction, ItemId, Transform } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { shallowEqual } from "../internal/utils/objects";

import { DashboardLayoutProps } from "./interfaces";

interface ItemContainerProxyProps<D> {
  itemRef: Ref<ItemContainerRef>;
  item: DashboardItem<D>;
  acquired: boolean;
  transform: null | Transform;
  itemSize: { width: number; height: number };
  itemMaxSize: { width: number; height: number };
  onItemNavigate: (itemId: ItemId, direction: Direction) => void;
  renderItem: (item: DashboardItem<D>, actions: DashboardLayoutProps.ItemActions) => React.ReactNode;
  removeItemAction: (item: DashboardItem<D>) => void;
}

export default memo(ItemContainerProxy, (prevProps, nextProps) => {
  const ignore = new Set(["itemRef"]);
  const allKeys = [...new Set(Object.keys({ ...prevProps, ...nextProps }))];

  for (const key of allKeys.filter((key) => !ignore.has(key))) {
    const prev = (prevProps as Record<string, unknown>)[key];
    const next = (nextProps as Record<string, unknown>)[key];

    if (typeof prev === "object" && typeof next === "object" && !shallowEqual(prev, next)) {
      return false;
    }

    if (prev !== next) {
      return false;
    }
  }
  return true;
}) as typeof ItemContainerProxy;

function ItemContainerProxy<D>({
  itemRef,
  item,
  acquired,
  transform,
  itemSize,
  itemMaxSize,
  onItemNavigate,
  renderItem,
  removeItemAction,
}: ItemContainerProxyProps<D>) {
  return (
    <ItemContainer
      ref={itemRef}
      key={item.id}
      item={item}
      acquired={acquired}
      itemSize={itemSize}
      itemMaxSize={itemMaxSize}
      transform={transform}
      onNavigate={onItemNavigate}
    >
      {renderItem(item, { removeItem: () => removeItemAction(item) })}
    </ItemContainer>
  );
}

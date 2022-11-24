// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Transform } from "@dnd-kit/utilities";
import { createContext, useContext } from "react";
import { DashboardItemBase } from "./interfaces";

export interface ItemContext {
  item: DashboardItemBase<unknown>;
  itemSize: { width: number; height: number };
  resizable: boolean;
  transform: Transform | null;
}

const Context = createContext<ItemContext | null>(null);

export const ItemContextProvider = Context.Provider;

export function useItemContext() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error("Unable to find DashboardItem context");
  }
  return ctx;
}

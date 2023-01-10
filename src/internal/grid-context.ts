// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { createContext, useContext } from "react";

export interface GridContext {
  getWidth: (colspan: number) => number;
  getHeight: (rowspan: number) => number;
}

const Context = createContext<GridContext | null>(null);

export const GridContextProvider = Context.Provider;

export function useGridContext() {
  return useContext(Context);
}

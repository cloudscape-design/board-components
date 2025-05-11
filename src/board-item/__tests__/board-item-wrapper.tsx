// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";

import { ItemContext } from "../../../lib/components/internal/item-container";

export function ItemContextWrapper({ children }: { children: ReactNode }) {
  return (
    <ItemContext.Provider
      value={{
        isActive: false,
        dragHandle: {
          ref: { current: null },
          onPointerDown: () => {},
          onKeyDown: () => {},
          isActivePointer: false,
          isActiveUap: false,
          onDirectionClick: () => {},
        },
        resizeHandle: {
          onPointerDown: () => {},
          onKeyDown: () => {},
          isActivePointer: false,
          isActiveUap: false,
          onDirectionClick: () => {},
        },
      }}
    >
      {children}
    </ItemContext.Provider>
  );
}

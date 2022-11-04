// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import clsx from "clsx";
import Box from "@cloudscape-design/components/box";
import css from "./styles.module.css";
import { DashboardLayout } from "../../lib/components";
import { initialItems, Item } from "./items";

export default function () {
  const [items, setItems] = useState<ReadonlyArray<Item>>(initialItems);

  return (
    <main>
      <Box padding="m">
        <DashboardLayout
          items={items}
          renderItem={(item, context) => (
            <div
              ref={context.ref}
              className={clsx(css.item, context.isDragging && css.itemDragging)}
              {...context.props}
              style={{ ...context.props.style, backgroundColor: item.data.color }}
            >
              {item.id}
            </div>
          )}
          onItemsChange={(event) => setItems(event.detail.items)}
        />
      </Box>
    </main>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Grid from "../internal/grid";
import type { DataFallbackType } from "../interfaces";
import { CanvasProps } from "./interfaces";
import Placeholder from "./placeholder";
import createGridLayout from "./create-grid-layout";
import useContainerQuery from "../internal/use-container-query/index";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../constants";
import styles from "./styles.css.js";

export default function Canvas<D = DataFallbackType>({ items, renderItem }: CanvasProps<D>) {
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const { content, placeholders, rows } = createGridLayout({ items, columns });

  return (
    <section ref={containerQueryRef}>
      <Grid columns={columns} rows={rows} layout={[...placeholders, ...content]}>
        {placeholders.map(({ id }) => (
          <Placeholder key={id} state="default" />
        ))}
        {items.map((item) => (
          <div key={item.id} className={styles.item}>
            {renderItem(item)}
          </div>
        ))}
      </Grid>
    </section>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Grid from "../internal/grid";
import type { DataFallbackType } from "../interfaces";
import { CanvasProps } from "./interfaces";
import Placeholder from "./placeholder";
import useGridLayout from "./use-grid-layout";
import useContainerQuery from "../internal/hooks/use-container-query";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../constants";

export default function Canvas<D = DataFallbackType>({ items, renderItem }: CanvasProps<D>) {
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const { content, placeholders, rows } = useGridLayout({ items, columns });

  return (
    <section ref={containerQueryRef}>
      <Grid columns={columns} rows={rows} layout={[...placeholders, ...content]}>
        {placeholders.map(({ id }) => (
          <Placeholder key={id} state="default" />
        ))}
        {items.map((item) => renderItem(item))}
      </Grid>
    </section>
  );
}

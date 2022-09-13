// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Grid from "../internal/grid";
import type { DataFallbackType } from "../interfaces";
import { CanvasProps } from "./interfaces";
import Placeholder from "./placeholder";
import useGridLayout from "./hooks/use-grid-layout";
import useContainerQuery from "../internal/hooks/use-container-query";

// TODO: Use constant breakpoint
const SMALL_WIDTH_BREAKPOINT = 688;
const SMALL_WIDTH_COLUMNS = 1;
const FULL_WIDTH_COLUMNS = 4;

export default function Canvas<D = DataFallbackType>(props: CanvasProps<D>) {
  const [measuredColumns, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < SMALL_WIDTH_BREAKPOINT ? SMALL_WIDTH_COLUMNS : FULL_WIDTH_COLUMNS),
    []
  );

  const columns = measuredColumns ?? FULL_WIDTH_COLUMNS;
  const { content, grid, rows } = useGridLayout({ ...props, columns });

  return (
    <section ref={containerQueryRef}>
      <Grid columns={columns} rows={rows} layout={[...grid, ...content]}>
        {grid.map(({ id }) => (
          <Placeholder key={id} state="default" />
        ))}
        {props.items.map((item) => props.renderItem(item))}
      </Grid>
    </section>
  );
}

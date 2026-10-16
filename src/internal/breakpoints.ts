// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContainerQuery } from "@cloudscape-design/component-toolkit";

import type { BoardProps } from "../board/interfaces";

const BREAKPOINTS: ReadonlyArray<readonly [BoardProps.Breakpoint, number]> = [
  ["xl", 1840],
  ["l", 1320],
  ["m", 1120],
  ["s", 912],
  ["xs", 688],
  ["xxs", 465],
  ["default", -1],
];

function getDefaultColumns(width: number) {
  if (width < 688) {
    return 1;
  }
  if (width < 912) {
    return 2;
  }
  if (width < 2100) {
    return 4;
  }
  return 6;
}

function isValidColumnCount(columns: number | undefined): columns is number {
  return typeof columns === "number" && Number.isInteger(columns) && columns > 0;
}

function getMatchingBreakpoint(width: number) {
  return BREAKPOINTS.find(([, minWidth]) => width > minWidth)![0];
}

function getConfiguredColumns(columnLayout: BoardProps.ColumnLayout, actualBreakpoint: BoardProps.Breakpoint) {
  const actualBreakpointIndex = BREAKPOINTS.findIndex(([breakpoint]) => breakpoint === actualBreakpoint);

  for (const [breakpoint] of BREAKPOINTS.slice(actualBreakpointIndex)) {
    const columns = columnLayout[breakpoint];
    if (isValidColumnCount(columns)) {
      return columns;
    }
  }

  return null;
}

export function resolveContainerColumns(width: number, columnLayout?: BoardProps.ColumnLayout) {
  if (!columnLayout) {
    return getDefaultColumns(width);
  }

  const breakpoint = getMatchingBreakpoint(width);

  return getConfiguredColumns(columnLayout, breakpoint) ?? getDefaultColumns(width);
}

export function useContainerColumns(columnLayout?: BoardProps.ColumnLayout) {
  const { default: defaultColumns, xxs, xs, s, m, l, xl } = columnLayout ?? {};
  const [columns, containerQueryRef] = useContainerQuery(
    (entry) => {
      return resolveContainerColumns(entry.contentBoxWidth, { default: defaultColumns, xxs, xs, s, m, l, xl });
    },
    [defaultColumns, xxs, xs, s, m, l, xl],
  );

  return [columns ?? 0, containerQueryRef] as const;
}

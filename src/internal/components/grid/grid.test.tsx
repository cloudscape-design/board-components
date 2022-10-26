// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "vitest";
import { render } from "@testing-library/react";
import Grid, { GridProps } from "../../../../lib/internal/components/grid";
import gridStyles from "../../../../lib/internal/components/grid/styles.selectors";

const defaultProps: GridProps = {
  rows: 1,
  columns: 4,
  layout: [
    { id: "one", columnOffset: 1, columnSpan: 2, rowOffset: 1, rowSpan: 1 },
    { id: "two", columnOffset: 3, columnSpan: 2, rowOffset: 1, rowSpan: 1 },
  ],
  children: (
    <>
      <span key="one" data-testid="child" />
      <span key="two" data-testid="child" />
    </>
  ),
};

test("renders children content", async () => {
  const result = render(<Grid {...defaultProps} />);

  const children = await result.findAllByTestId("child");
  expect(children.length).toBe(2);
});

test("annotates data attributes on root element", () => {
  const { container } = render(<Grid {...defaultProps} />);

  const root = container.querySelector(`.${gridStyles.grid}`);
  expect((root as HTMLDivElement).dataset).toMatchObject({
    rows: "1",
    columns: "4",
  });
});

test("annotates data attributes on individual elements", () => {
  const { container } = render(<Grid {...defaultProps} />);
  const items = container.querySelectorAll<HTMLDivElement>(`.${gridStyles.grid__item}`);

  expect(items[0].dataset).toMatchObject({
    rowSpan: "1",
    columnSpan: "2",
    columnOffset: "1",
    rowOffset: "1",
  });
  expect(items[1].dataset).toMatchObject({
    rowSpan: "1",
    columnSpan: "2",
    columnOffset: "3",
    rowOffset: "1",
  });
});

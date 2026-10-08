// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { render } from "@testing-library/react";
import { expect, test } from "vitest";

import Grid, { GridProps } from "../../../../lib/components/internal/grid";

import gridStyles from "../../../../lib/components/internal/grid/styles.css.js";

const defaultProps: GridProps = {
  columns: 4,
  layout: [
    { id: "one", x: 0, width: 2, y: 0, height: 1 },
    { id: "two", x: 2, width: 2, y: 0, height: 1 },
  ],
  children: () => (
    <>
      <span key="one" data-testid="child" />
      <span key="two" data-testid="child" />
    </>
  ),
};

const ROW_HEIGHT_CSS_PROPERTY = "--awsui-board-row-height";

function getGridRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>(`.${gridStyles.grid}`)!;
}

test("renders children content", async () => {
  const result = render(<Grid {...defaultProps} />);

  const children = await result.findAllByTestId("child");
  expect(children.length).toBe(2);
});

test("assigns styles on root element", () => {
  const { container } = render(<Grid {...defaultProps} />);

  const root = container.querySelector(`.${gridStyles.grid}`);
  expect(root).toHaveClass(gridStyles["columns-4"]);
});

test("assigns styles on individual elements", () => {
  const { container } = render(<Grid {...defaultProps} />);
  const items = container.querySelectorAll<HTMLDivElement>(`.${gridStyles.grid__item}`);

  expect(items[0]).toHaveStyle({
    "grid-row-start": "1",
    "grid-row-end": "span 1",
    "grid-column-start": "1",
    "grid-column-end": "span 2",
  });
  expect(items[1]).toHaveStyle({
    "grid-row-start": "1",
    "grid-row-end": "span 1",
    "grid-column-start": "3",
    "grid-column-end": "span 2",
  });
});

test("uses the default row height when rowHeight is not provided", () => {
  const { container } = render(<Grid {...defaultProps} />);

  // Defaults to the comfortable-mode row height (96px).
  expect(getGridRoot(container).style.getPropertyValue(ROW_HEIGHT_CSS_PROPERTY)).toBe("96px");
});

test("applies a custom row height when rowHeight is provided", () => {
  const { container } = render(<Grid {...defaultProps} rowHeight={32} />);

  expect(getGridRoot(container).style.getPropertyValue(ROW_HEIGHT_CSS_PROPERTY)).toBe("32px");
});

test.each([0, -10, NaN, Infinity])("ignores invalid rowHeight value %s and falls back to default", (rowHeight) => {
  const { container } = render(<Grid {...defaultProps} rowHeight={rowHeight} />);

  expect(getGridRoot(container).style.getPropertyValue(ROW_HEIGHT_CSS_PROPERTY)).toBe("96px");
});

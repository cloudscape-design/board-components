// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, expect, test } from "vitest";

import Board from "../../../lib/components/board";
import { defaultProps } from "./utils";

import gridStyles from "../../../lib/components/internal/grid/styles.css.js";

const ROW_HEIGHT_CSS_PROPERTY = "--awsui-board-row-height";

beforeAll(() => {
  // jsdom does not support this function
  document.elementFromPoint = () => null;
});

afterEach(() => {
  cleanup();
});

function getGridRoot(container: HTMLElement) {
  return container.querySelector<HTMLElement>(`.${gridStyles.grid}`)!;
}

test("uses the default row height when rowHeight is not provided", () => {
  const { container } = render(<Board {...defaultProps} />);

  expect(getGridRoot(container).style.getPropertyValue(ROW_HEIGHT_CSS_PROPERTY)).toBe("96px");
});

test("forwards a custom rowHeight to the underlying grid", () => {
  const { container } = render(<Board {...defaultProps} rowHeight={32} />);

  expect(getGridRoot(container).style.getPropertyValue(ROW_HEIGHT_CSS_PROPERTY)).toBe("32px");
});

test("ignores a non-positive rowHeight and keeps the default", () => {
  const { container } = render(<Board {...defaultProps} rowHeight={0} />);

  expect(getGridRoot(container).style.getPropertyValue(ROW_HEIGHT_CSS_PROPERTY)).toBe("96px");
});

test("does not leak rowHeight to the root element as a data attribute", () => {
  const { container } = render(<Board {...defaultProps} rowHeight={48} />);

  // The root board element must not receive a `rowHeight` attribute.
  expect(container.firstElementChild?.hasAttribute("rowheight")).toBe(false);
});

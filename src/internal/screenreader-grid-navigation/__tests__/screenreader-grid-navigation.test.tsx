// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { GridLayout } from "../../../../lib/components/internal/interfaces";
import { ScreenReaderGridNavigation } from "../../../../lib/components/internal/screenreader-grid-navigation";

interface Item {
  id: string;
  title: string;
}

const items: readonly Item[] = [
  { id: "1", title: "One" },
  { id: "2", title: "Two" },
];
const itemsLayout: GridLayout = {
  items: [
    { id: "1", x: 0, y: 0, width: 1, height: 1 },
    { id: "2", x: 1, y: 0, width: 1, height: 1 },
  ],
  columns: 4,
  rows: 1,
};

afterEach(cleanup);

test("ARIA labels", () => {
  const { container, getByLabelText, getByRole } = render(
    <ScreenReaderGridNavigation<Item>
      items={items}
      itemsLayout={itemsLayout}
      ariaLabel="Board navigation"
      ariaDescription="Board navigation description"
      itemAriaLabel={(item) => (item ? `Item ${item.title}` : "Empty")}
      onActivateItem={() => undefined}
    />,
  );

  // Navigation labels.
  expect(getByLabelText("Board navigation")).toBeDefined();
  expect(getByRole("navigation", { description: "Board navigation description" }));

  // Navigation items labels.
  const cells = Array.from(container.querySelectorAll("td")).map((cell) => cell.textContent);
  expect(cells).toEqual(["Item One", "Item Two", "Empty", "Empty"]);
});

test("Can activate items", () => {
  const onFocusItemSpy = vi.fn();
  const { container } = render(
    <ScreenReaderGridNavigation<Item>
      items={items}
      itemsLayout={itemsLayout}
      ariaLabel="Board navigation"
      ariaDescription="Board navigation description"
      itemAriaLabel={(item) => (item ? `Item ${item.title}` : "Empty")}
      onActivateItem={onFocusItemSpy}
    />,
  );
  container.querySelector("button")?.click();
  expect(onFocusItemSpy).toBeCalledWith("1");
});

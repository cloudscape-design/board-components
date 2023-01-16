// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { act, cleanup, render as libRender } from "@testing-library/react";
import { ReactElement, ReactNode, Ref, forwardRef } from "react";
import { afterEach, expect, test, vi } from "vitest";
import itemStyles from "../../../lib/components/board-item/styles.css.js";
import { mockController } from "../../../lib/components/internal/dnd-controller/__mocks__/controller";
import { ItemContainerRef } from "../../../lib/components/internal/item-container";
import ItemsPalette, { ItemsPaletteProps } from "../../../lib/components/items-palette";
import createWrapper, { ItemsPaletteWrapper } from "../../../lib/components/test-utils/dom";

afterEach(cleanup);

vi.mock("../../../lib/components/internal/dnd-controller/controller");
vi.mock("../../../lib/components/internal/item-container", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ItemContainer: forwardRef(({ children }: { children: ReactNode }, ref: Ref<ItemContainerRef>) => (
    <div>{children}</div>
  )),
}));

function render(jsx: ReactElement) {
  libRender(jsx);
  return createWrapper().findItemsPalette()!;
}

const defaultProps: ItemsPaletteProps = {
  i18nStrings: {
    liveAnnouncementDragStarted: "Dragging",
    liveAnnouncementDragDiscarded: "Insertion discarded",
    navigationAriaLabel: "Items palette navigation",
    navigationItemAriaLabel: (item) => item.id,
  },
  items: [
    { id: "first", definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, data: {} },
    { id: "second", definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, data: {} },
  ],
  renderItem: (item, { showPreview }) => (
    <div className={itemStyles.root}>
      <h2>{item.id}</h2>
      <span data-testid="showPreview">{`${showPreview}`}</span>
    </div>
  ),
};

function getPreviewState(wrapper: ItemsPaletteWrapper) {
  return wrapper.findItems().map((item) => item.find('[data-testid="showPreview"]')!.getElement().textContent);
}

test("renders palette and items", () => {
  const wrapper = render(<ItemsPalette {...defaultProps} />);
  expect(wrapper.findItems()).toHaveLength(2);
});

test("updates preview state when drop target changes", () => {
  const wrapper = render(<ItemsPalette {...defaultProps} />);
  expect(getPreviewState(wrapper)).toEqual(["false", "false"]);
  act(() => mockController.update({ draggableItem: { id: "second" }, dropTarget: {} } as any));
  expect(getPreviewState(wrapper)).toEqual(["false", "true"]);
  act(() => mockController.update({ draggableItem: { id: "second" }, dropTarget: null } as any));
  expect(getPreviewState(wrapper)).toEqual(["false", "false"]);
});

test("updates preview state when operation submits", () => {
  const wrapper = render(<ItemsPalette {...defaultProps} />);
  act(() => mockController.update({ draggableItem: { id: "second" }, dropTarget: {} } as any));
  expect(getPreviewState(wrapper)).toEqual(["false", "true"]);
  act(() => mockController.submit());
  expect(getPreviewState(wrapper)).toEqual(["false", "false"]);
});

test("updates preview state when operation discards", () => {
  const wrapper = render(<ItemsPalette {...defaultProps} />);
  act(() => mockController.update({ draggableItem: { id: "second" }, dropTarget: {} } as any));
  expect(getPreviewState(wrapper)).toEqual(["false", "true"]);
  act(() => mockController.discard());
  expect(getPreviewState(wrapper)).toEqual(["false", "false"]);
});

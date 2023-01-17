// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { act, cleanup, render as libRender } from "@testing-library/react";
import { ReactElement, forwardRef } from "react";
import { afterEach, expect, test, vi } from "vitest";
import itemStyles from "../../../lib/components/board-item/styles.css.js";
import { DragAndDropEvents, useDragSubscription } from "../../../lib/components/internal/dnd-controller/controller";
import { EventEmitter } from "../../../lib/components/internal/dnd-controller/event-emitter";
import ItemsPalette, { ItemsPaletteProps } from "../../../lib/components/items-palette";
import createWrapper, { ItemsPaletteWrapper } from "../../../lib/components/test-utils/dom";

afterEach(cleanup);

vi.mock("../../../lib/components/internal/dnd-controller/controller", () => ({ useDragSubscription: vi.fn() }));
vi.mock("../../../lib/components/internal/item-container", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ItemContainer: forwardRef(({ children }: { children: ReactElement }, ref) => <div>{children}</div>),
}));

class FakeEmitter extends EventEmitter<DragAndDropEvents> {
  constructor() {
    vi.mocked(useDragSubscription).mockImplementation((event, handler) => {
      this.on(event, handler);
    });
    super();
  }

  public emit(event: keyof DragAndDropEvents, ...data: Parameters<DragAndDropEvents[keyof DragAndDropEvents]>) {
    super.emit(event, ...data);
  }
}

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
  const fakeEmitter = new FakeEmitter();
  const wrapper = render(<ItemsPalette {...defaultProps} />);
  expect(getPreviewState(wrapper)).toEqual(["false", "false"]);
  act(() => fakeEmitter.emit("update", { draggableItem: { id: "second" }, dropTarget: {} } as any));
  expect(getPreviewState(wrapper)).toEqual(["false", "true"]);
  act(() => fakeEmitter.emit("update", { draggableItem: { id: "second" }, dropTarget: null } as any));
  expect(getPreviewState(wrapper)).toEqual(["false", "false"]);
});

test("updates preview state when operation submits", () => {
  const fakeEmitter = new FakeEmitter();
  const wrapper = render(<ItemsPalette {...defaultProps} />);
  act(() => fakeEmitter.emit("update", { draggableItem: { id: "second" }, dropTarget: {} } as any));
  expect(getPreviewState(wrapper)).toEqual(["false", "true"]);
  act(() => fakeEmitter.emit("submit"));
  expect(getPreviewState(wrapper)).toEqual(["false", "false"]);
});

test("updates preview state when operation discards", () => {
  const fakeEmitter = new FakeEmitter();
  const wrapper = render(<ItemsPalette {...defaultProps} />);
  act(() => fakeEmitter.emit("update", { draggableItem: { id: "second" }, dropTarget: {} } as any));
  expect(getPreviewState(wrapper)).toEqual(["false", "true"]);
  act(() => fakeEmitter.emit("discard"));
  expect(getPreviewState(wrapper)).toEqual(["false", "false"]);
});
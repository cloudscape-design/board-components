// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from "react";
import { cleanup, fireEvent, render as libRender } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Header from "@cloudscape-design/components/header";
import DragHandleWrapper from "@cloudscape-design/components/test-utils/dom/internal/drag-handle";
import TooltipWrapper from "@cloudscape-design/components/test-utils/dom/internal/tooltip";

import "@cloudscape-design/components/test-utils/dom";
import BoardItem from "../../../lib/components/board-item";
import createWrapper from "../../../lib/components/test-utils/dom";
import { ItemContextWrapper } from "./board-item-wrapper";

const i18nStrings = {
  dragHandleAriaLabel: "Drag handle",
  resizeHandleAriaLabel: "Resize handle",
  dragHandleTooltipText: "Drag or select to move",
  resizeHandleTooltipText: "Drag or select to resize",
};

function render(jsx: ReactElement) {
  return libRender(jsx, {
    wrapper: ItemContextWrapper,
  });
}

describe("WidgetContainer", () => {
  afterEach(() => {
    cleanup();
  });
  test("renders slots", () => {
    render(
      <div>
        {/* Render an extra container to ensure board item test-utils are properly scoped. */}
        <Container header="Container header" footer="Container footer">
          Container content
        </Container>
        <BoardItem
          header={<Header>Header</Header>}
          footer={<ExpandableSection headerText="Footer">Footer expandable content</ExpandableSection>}
          settings={<Button iconName="settings" ariaLabel="Settings" />}
          i18nStrings={i18nStrings}
        >
          Content <Button>Action</Button>
        </BoardItem>
      </div>,
    );

    const itemWrapper = createWrapper().findBoardItem()!;
    expect(itemWrapper.findHeader()!.findHeader()!.getElement()).toHaveTextContent("Header");
    expect(itemWrapper.findContent()!.findButton()!.getElement()).toHaveTextContent("Action");
    expect(itemWrapper.findFooter()!.findExpandableSection()!.findHeader()!.getElement()).toHaveTextContent("Footer");
    expect(itemWrapper.findSettings()!.findButton()!.getElement()).toHaveAccessibleName("Settings");
  });

  test("renders handle aria labels", () => {
    const { getByLabelText } = render(<BoardItem i18nStrings={i18nStrings} />);

    expect(getByLabelText("Drag handle")).toBeDefined();
    expect(getByLabelText("Resize handle")).toBeDefined();
  });

  test("renders drag handle tooltip text if provided", () => {
    render(<BoardItem i18nStrings={i18nStrings} />);
    const wrapper = createWrapper();
    const dragHandleEl = wrapper.findBoardItem()!.findDragHandle().getElement();

    fireEvent(dragHandleEl, new MouseEvent("pointerover", { bubbles: true }));
    const tooltipEl = wrapper.findByClassName(TooltipWrapper.rootSelector)!.getElement();
    expect(tooltipEl.textContent).toBe("Drag or select to move");
  });

  test("does not render drag handle tooltip text if not provided", () => {
    render(<BoardItem i18nStrings={{ ...i18nStrings, dragHandleTooltipText: undefined }} />);
    const wrapper = createWrapper();
    const dragHandleEl = wrapper.findBoardItem()!.findDragHandle().getElement();

    fireEvent(dragHandleEl, new MouseEvent("pointerover", { bubbles: true }));
    expect(wrapper.findByClassName(TooltipWrapper.rootSelector)).toBeNull();
  });

  test("renders drag handle UAP actions on handle click", () => {
    render(<BoardItem i18nStrings={i18nStrings} />);
    const dragHandleEl = createWrapper().findBoardItem()!.findDragHandle()!.getElement();

    fireEvent(dragHandleEl, new MouseEvent("pointerdown", { bubbles: true }));
    fireEvent(dragHandleEl, new MouseEvent("pointerup", { bubbles: true }));

    const dragHandleWrapper = new DragHandleWrapper(document.body);
    expect(dragHandleWrapper.findAllVisibleDirectionButtons()).toHaveLength(4);
    expect(dragHandleWrapper.findVisibleDirectionButtonBlockStart()).toBeDefined();
    expect(dragHandleWrapper.findVisibleDirectionButtonBlockEnd()).toBeDefined();
    expect(dragHandleWrapper.findVisibleDirectionButtonInlineStart()).toBeDefined();
    expect(dragHandleWrapper.findVisibleDirectionButtonInlineEnd()).toBeDefined();
  });

  test("renders resize handle tooltip text", () => {
    render(<BoardItem i18nStrings={i18nStrings} />);
    const wrapper = createWrapper();
    const resizeHandleEl = wrapper.findBoardItem()!.findResizeHandle()!.getElement();

    fireEvent(resizeHandleEl, new MouseEvent("pointerover", { bubbles: true }));
    const tooltipEl = wrapper.findByClassName(TooltipWrapper.rootSelector)!.getElement();
    expect(tooltipEl.textContent).toBe("Drag or select to resize");
  });

  test("does not render resize handle tooltip text if not provided", () => {
    render(<BoardItem i18nStrings={{ ...i18nStrings, resizeHandleTooltipText: undefined }} />);
    const wrapper = createWrapper();
    const resizeHandleEl = wrapper.findBoardItem()!.findResizeHandle()!.getElement();

    fireEvent(resizeHandleEl, new MouseEvent("pointerover", { bubbles: true }));
    expect(wrapper.findByClassName(TooltipWrapper.rootSelector)).toBeNull();
  });

  test("renders resize handle UAP actions on handle click", () => {
    render(<BoardItem i18nStrings={i18nStrings} />);
    const resizeHandleEl = createWrapper().findBoardItem()!.findResizeHandle()!.getElement();

    fireEvent(resizeHandleEl, new MouseEvent("pointerdown", { bubbles: true }));
    fireEvent(resizeHandleEl, new MouseEvent("pointerup", { bubbles: true }));

    const dragHandleWrapper = new DragHandleWrapper(document.body);
    expect(dragHandleWrapper.findAllVisibleDirectionButtons()).toHaveLength(4);
    expect(dragHandleWrapper.findVisibleDirectionButtonBlockStart()).toBeDefined();
    expect(dragHandleWrapper.findVisibleDirectionButtonBlockEnd()).toBeDefined();
    expect(dragHandleWrapper.findVisibleDirectionButtonInlineStart()).toBeDefined();
    expect(dragHandleWrapper.findVisibleDirectionButtonInlineEnd()).toBeDefined();
  });
});

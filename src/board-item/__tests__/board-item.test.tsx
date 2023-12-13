// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { cleanup, render as libRender } from "@testing-library/react";
import { ReactElement } from "react";
import { afterEach, describe, expect, test } from "vitest";
import BoardItem from "../../../lib/components/board-item";
import createWrapper from "../../../lib/components/test-utils/dom";
import { ItemContextWrapper } from "./board-item-wrapper";

const i18nStrings = {
  dragHandleAriaLabel: "Drag handle",
  resizeHandleAriaLabel: "Resize handle",
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
        <BoardItem header="Header" footer="Footer" settings="Settings" i18nStrings={i18nStrings}>
          Content
        </BoardItem>
      </div>
    );
    const itemWrapper = createWrapper().findBoardItem()!;
    expect(itemWrapper.findHeader()!.getElement().textContent).toBe("Header");
    expect(itemWrapper.findContent().getElement().textContent).toBe("Content");
    expect(itemWrapper.findFooter()!.getElement().textContent).toBe("Footer");
    expect(itemWrapper.findSettings()!.getElement().textContent).toBe("Settings");
  });

  test("renders handle aria labels", () => {
    const { getByLabelText } = render(<BoardItem i18nStrings={i18nStrings} />);

    expect(getByLabelText("Drag handle")).toBeDefined();
    expect(getByLabelText("Resize handle")).toBeDefined();
  });
});

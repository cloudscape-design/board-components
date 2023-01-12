// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cleanup, render as libRender } from "@testing-library/react";
import { ReactElement } from "react";
import { afterEach, describe, expect, test } from "vitest";
import BoardItem from "../../../lib/components/board-item";
import { GridContextProvider } from "../../../lib/components/internal/grid-context";
import { ItemContainer } from "../../../lib/components/internal/item-container";
import createWrapper from "../../../lib/components/test-utils/dom";

const i18nStrings = {
  dragHandleAriaLabel: "Drag handle",
  resizeHandleAriaLabel: "Resize handle",
};

function render(jsx: ReactElement) {
  return libRender(jsx, {
    wrapper: function ItemContextWrapper({ children }) {
      return (
        <GridContextProvider value={{ getWidth: () => 1, getHeight: () => 1 }}>
          <ItemContainer
            item={{ id: "1", definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, data: null }}
            itemSize={{ width: 1, height: 1 }}
            itemMaxSize={{ width: 1, height: 1 }}
          >
            {children}
          </ItemContainer>
        </GridContextProvider>
      );
    },
  });
}

describe("WidgetContainer", () => {
  afterEach(() => {
    cleanup();
  });
  test("renders slots", () => {
    render(
      <BoardItem
        header={<span data-testid="header" />}
        footer={<span data-testid="footer" />}
        settings={<span data-testid="settings"></span>}
        i18nStrings={i18nStrings}
      >
        <span data-testid="content" />
      </BoardItem>
    );
    const itemWrapper = createWrapper().findBoardItem()!;
    expect(itemWrapper.find('[data-testid="header"]')).toBeDefined();
    expect(itemWrapper.find('[data-testid="content"]')).toBeDefined();
    expect(itemWrapper.find('[data-testid="footer"]')).toBeDefined();
    expect(itemWrapper.find('[data-testid="settings"]')).toBeDefined();
  });

  test("renders handle aria labels", () => {
    const { getByLabelText } = render(<BoardItem i18nStrings={i18nStrings} />);

    expect(getByLabelText("Drag handle")).toBeDefined();
    expect(getByLabelText("Resize handle")).toBeDefined();
  });
});

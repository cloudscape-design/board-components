// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cleanup, render as libRender } from "@testing-library/react";
import { ReactElement } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { GridContextProvider } from "../../../lib/components/internal/grid-context";
import { ItemContainer } from "../../../lib/components/internal/item-container";
import DashboardItem from "../../../lib/components/item";
import createWrapper from "../../../lib/components/test-utils/dom";

function render(jsx: ReactElement) {
  return libRender(jsx, {
    wrapper: function ItemContextWrapper({ children }) {
      return (
        <GridContextProvider value={{ getWidth: () => 1, getHeight: () => 1 }}>
          <ItemContainer
            item={{ id: "1", definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, data: null }}
            itemSize={{ width: 1, height: 1 }}
            itemMaxSize={{ width: 1, height: 1 }}
            onNavigate={() => undefined}
            dragHandleAriaLabel="Drag handle aria label"
            dragHandleAriaDescription="Drag handle aria description"
            resizeHandleAriaLabel="Resize handle aria label"
            resizeHandleAriaDescription="Resize handle aria description"
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
      <DashboardItem
        header={<span data-testid="header" />}
        footer={<span data-testid="footer" />}
        settings={<span data-testid="settings"></span>}
      >
        <span data-testid="content" />
      </DashboardItem>
    );
    const itemWrapper = createWrapper().findDashboardItem()!;
    expect(itemWrapper.find('[data-testid="header"]')).toBeDefined();
    expect(itemWrapper.find('[data-testid="content"]')).toBeDefined();
    expect(itemWrapper.find('[data-testid="footer"]')).toBeDefined();
    expect(itemWrapper.find('[data-testid="settings"]')).toBeDefined();
  });

  test("renders handle aria labels", () => {
    const { getByLabelText } = render(<DashboardItem />);

    expect(getByLabelText("Drag handle aria label")).toBeDefined();
    expect(getByLabelText("Resize handle aria label")).toBeDefined();
  });
});

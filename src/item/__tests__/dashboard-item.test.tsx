// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cleanup, render as libRender } from "@testing-library/react";
import { ReactElement } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { GridContextProvider } from "../../../lib/components/internal/grid-context";
import { ItemContextProvider } from "../../../lib/components/internal/item-context";
import type { DashboardItemProps } from "../../../lib/components/item";
import DashboardItem from "../../../lib/components/item";
import createWrapper from "../../../lib/components/test-utils/dom";

export const i18nStrings: DashboardItemProps["i18nStrings"] = {
  dragHandleLabel: "Drag handle",
  resizeLabel: "Resize handle",
};

function render(jsx: ReactElement) {
  return libRender(jsx, {
    wrapper: function ItemContextWrapper({ children }) {
      return (
        <GridContextProvider
          value={{ getWidth: () => 1, getHeight: () => 1, getColOffset: () => 1, getRowOffset: () => 1 }}
        >
          <ItemContextProvider
            value={{
              item: { id: "1", definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, data: null },
              itemSize: { width: 1, height: 1 },
              transform: null,
            }}
          >
            {children}
          </ItemContextProvider>
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
        i18nStrings={i18nStrings}
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
    const { getByLabelText } = render(<DashboardItem i18nStrings={i18nStrings} />);

    expect(getByLabelText(i18nStrings.dragHandleLabel)).toBeDefined();
    expect(getByLabelText(i18nStrings.resizeLabel)).toBeDefined();
  });
});

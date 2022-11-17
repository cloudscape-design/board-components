// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cleanup, render as libRender } from "@testing-library/react";
import { ReactElement } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { ItemContextProvider } from "../../../lib/components/internal/item-context";
import type { DashboardItemProps } from "../../../lib/components/item";
import DashboardItem from "../../../lib/components/item";

export const i18nStrings: DashboardItemProps["i18nStrings"] = {
  dragHandleLabel: "Drag handle",
  resizeLabel: "Resize handle",
};

function render(jsx: ReactElement) {
  return libRender(jsx, {
    wrapper: function ItemContextWrapper({ children }) {
      return (
        <ItemContextProvider value={{ id: "1", transform: null, resizable: true }}>{children}</ItemContextProvider>
      );
    },
  });
}

describe("WidgetContainer", () => {
  afterEach(() => {
    cleanup();
  });
  test("renders slots", () => {
    const { getByTestId } = render(
      <DashboardItem
        i18nStrings={i18nStrings}
        header={<span data-testid="header" />}
        footer={<span data-testid="footer" />}
        settings={<span data-testid="settings"></span>}
      >
        <span data-testid="content" />
      </DashboardItem>
    );
    expect(getByTestId("header")).toBeDefined();
    expect(getByTestId("content")).toBeDefined();
    expect(getByTestId("footer")).toBeDefined();
    expect(getByTestId("settings")).toBeDefined();
  });
  test("renders handle aria labels", () => {
    const { getByLabelText } = render(<DashboardItem i18nStrings={i18nStrings} />);

    expect(getByLabelText(i18nStrings.dragHandleLabel)).toBeDefined();
    expect(getByLabelText(i18nStrings.resizeLabel)).toBeDefined();
  });
});

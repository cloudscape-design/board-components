// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { WidgetContainerProps } from "../../../lib/components/widget-container";
import WidgetContainer from "../../../lib/components/widget-container";
import { render, cleanup } from "@testing-library/react";
import { describe, test, expect, afterEach } from "vitest";

export const i18nStrings: WidgetContainerProps["i18nStrings"] = {
  dragHandleLabel: "Drag handle",
  resizeLabel: "Resize handle",
};

describe("WidgetContainer", () => {
  afterEach(() => {
    cleanup();
  });
  test("renders slots", () => {
    const { getByTestId } = render(
      <WidgetContainer
        i18nStrings={i18nStrings}
        header={<span data-testid="header" />}
        footer={<span data-testid="footer" />}
        settings={<span data-testid="settings"></span>}
      >
        <span data-testid="content" />
      </WidgetContainer>
    );
    expect(getByTestId("header")).toBeDefined();
    expect(getByTestId("content")).toBeDefined();
    expect(getByTestId("footer")).toBeDefined();
    expect(getByTestId("settings")).toBeDefined();
  });
  test("renders handle aria labels", () => {
    const { getByLabelText } = render(<WidgetContainer i18nStrings={i18nStrings} />);

    expect(getByLabelText(i18nStrings.dragHandleLabel)).toBeDefined();
    expect(getByLabelText(i18nStrings.resizeLabel)).toBeDefined();
  });
});
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from "react";
import { cleanup, render as libRender } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import Header from "@cloudscape-design/components/header";

import "@cloudscape-design/components/test-utils/dom";
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
});

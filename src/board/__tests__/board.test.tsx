// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import Board, { BoardProps } from "../../../lib/components/board";
import createWrapper from "../../../lib/components/test-utils/dom";

interface ItemData {
  title: string;
}

const i18nStrings: BoardProps.I18nStrings<ItemData> = {
  liveAnnouncementOperationStarted() {
    return "Operation started";
  },
  liveAnnouncementOperationReorder() {
    return "Reorder performed";
  },
  liveAnnouncementOperationResize() {
    return "Resize performed";
  },
  liveAnnouncementOperationInsert() {
    return "Insert performed";
  },
  liveAnnouncementOperationRemove() {
    return "Remove performed";
  },
  liveAnnouncementOperationCommitted() {
    return "Operation committed";
  },
  liveAnnouncementOperationDiscarded() {
    return "Operation discarded";
  },
  navigationAriaLabel: "Board navigation",
  navigationAriaDescription: "Click on non-empty item to move focus over",
  navigationItemAriaLabel: (item) => (item ? item.data.title : "Empty"),
};

describe("Board", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders empty board", () => {
    render(
      <Board
        items={[]}
        renderItem={() => <>{null}</>}
        onItemsChange={() => undefined}
        i18nStrings={i18nStrings}
        empty="No items"
      />
    );
    const wrapper = createWrapper().findBoard()!;

    expect(wrapper.getElement().textContent).toBe("No items");
  });
});

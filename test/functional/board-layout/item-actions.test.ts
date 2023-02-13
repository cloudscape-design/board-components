// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { describe, expect, test } from "vitest";
import createWrapper from "../../../lib/components/test-utils/selectors";
import { DndPageObject } from "./dnd-page-object";

const boardWrapper = createWrapper().findBoard();
const boardItemHandle = (id: string) => boardWrapper.findItemById(id).findDragHandle().toSelector();

function setupTest(url: string, testFn: (page: DndPageObject, browser: WebdriverIO.Browser) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new DndPageObject(browser);
    await page.setWindowSize({ width: 1600, height: 800 });
    await page.waitForVisible("main");
    await testFn(page, browser);
  });
}

describe("items removal", () => {
  test(
    "focus is transitioned after non-last item removal",
    setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
      // Remove Widget F.
      await page.focus(boardItemHandle("F"));
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      // Remove Widget J.
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      // Remove Widget N.
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      // Remove Widget G.
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", " ", "K", "H"],
        ["E", " ", "K", "H"],
        ["I", " ", "O", "L"],
        ["I", " ", "O", "L"],
        ["M", " ", " ", "P"],
        ["M", " ", " ", "P"],
      ]);
    })
  );

  test(
    "focus is transitioned after last item removal",
    setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
      // Remove Widget P.
      await page.focus(boardItemHandle("P"));
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      // Remove Widget O.
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      // Remove Widget N.
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      // Remove Widget M.
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      // Remove Widget L.
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
        ["I", "J", "K", " "],
        ["I", "J", "K", " "],
      ]);
    })
  );

  test(
    "tab order is remains linear after removing an item in the middle",
    setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
      // Remove Widget F.
      await page.focus(boardItemHandle("F"));
      await page.keys(["Tab", "Enter", "Enter"]);
      await page.pause(200);

      // Focus drag handle of the item that follows Widget E.
      await page.focus(boardItemHandle("E"));
      await page.keys(["Tab", "Tab", "Tab"]);

      await expect(page.isFocused(boardItemHandle("J"))).resolves.toBe(true);
    })
  );

  test(
    "focus is transitioned correctly when delete confirmation dialog is required",
    setupTest("index.html#/with-app-layout/integ", async (page) => {
      // Remove Widget 5.
      await page.focus(boardItemHandle("5"));
      await page.keys(["Tab", "Enter", "Enter", "Tab", "Tab", "Enter"]);
      await page.pause(200);

      await expect(page.isExisting(boardItemHandle("5"))).resolves.toBe(false);
      await expect(page.isFocused(boardItemHandle("8"))).resolves.toBe(true);
    })
  );
});

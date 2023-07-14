// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { generateGrid, generateInsert, generateMove, generateResize } from "../../debug-tools";
import { LayoutEngine } from "../engine";
import { forEachTimes } from "./helpers";

const TOTAL_RUNS = 100;
const MAX_EXECUTION_TIME_MS = 50;

function measure(fn: () => void) {
  const timeBefore = Date.now();
  fn();
  const timeAfter = Date.now();
  return timeAfter - timeBefore;
}

test("move resolutions take reasonable time", () => {
  const totalTime = measure(() =>
    forEachTimes(TOTAL_RUNS, [[6, 26]], ([width, totalItems]) => {
      const grid = generateGrid({ width, totalItems });
      const engine = new LayoutEngine(grid);
      const executionTime = measure(() => engine.move(generateMove(engine.getLayoutShift().next, "any")));
      expect(executionTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
    })
  );
  console.log(`[engine-performance.test.ts] Move resolutions total time (${TOTAL_RUNS} runs):`, totalTime);
});

test("insert resolutions take reasonable time", () => {
  const totalTime = measure(() =>
    forEachTimes(TOTAL_RUNS, [[6, 26]], ([width, totalItems]) => {
      const grid = generateGrid({ width, totalItems });
      const engine = new LayoutEngine(grid);
      const executionTime = measure(() =>
        engine.insert(generateInsert(engine.getLayoutShift().next, "*", { maxWidth: 2, maxHeight: 4 }))
      );
      expect(executionTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
    })
  );
  console.log(`[engine-performance.test.ts] Insert resolutions total time (${TOTAL_RUNS} runs):`, totalTime);
});

test("resize resolutions take reasonable time", () => {
  const totalTime = measure(() =>
    forEachTimes(TOTAL_RUNS, [[6, 26]], ([width, totalItems]) => {
      const grid = generateGrid({ width, totalItems });
      const engine = new LayoutEngine(grid);
      const executionTime = measure(() =>
        engine.resize(generateResize(engine.getLayoutShift().next, { maxHeightIncrement: 4, maxWidthIncrement: 2 }))
      );
      expect(executionTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
    })
  );
  console.log(`[engine-performance.test.ts] Resize resolutions total time (${TOTAL_RUNS} runs):`, totalTime);
});

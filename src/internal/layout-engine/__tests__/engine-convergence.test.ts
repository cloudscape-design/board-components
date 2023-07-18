// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { generateGrid, generateInsert, generateMove, generateResize } from "../../debug-tools";
import { LayoutEngine } from "../engine";
import { forEachTimes } from "./helpers";

const TOTAL_RUNS = 100;
const AVERAGE_EXECUTION_TIME_MS = 5;
const MAX_EXECUTION_TIME_MS = 100;

function measure(fn: () => void) {
  const timeBefore = Date.now();
  fn();
  const timeAfter = Date.now();
  return timeAfter - timeBefore;
}

test("move resolutions take reasonable time", () => {
  let maxTime = 0;
  const totalTime = measure(() =>
    forEachTimes(TOTAL_RUNS, [[6, 26]], ([width, totalItems]) => {
      const grid = generateGrid({ width, totalItems });
      const engine = new LayoutEngine(grid);
      const executionTime = measure(() => engine.move(generateMove(grid, "any")));
      maxTime = Math.max(maxTime, executionTime);
    })
  );
  const averageTime = totalTime / TOTAL_RUNS;

  console.log(
    `[engine-performance.test.ts] Move resolutions average time: ${averageTime.toFixed(0)}ms, max time: ${maxTime}ms`
  );

  expect(averageTime).toBeLessThan(AVERAGE_EXECUTION_TIME_MS);
  expect(maxTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
});

test("insert resolutions take reasonable time", () => {
  let maxTime = 0;
  const totalTime = measure(() =>
    forEachTimes(TOTAL_RUNS, [[6, 26]], ([width, totalItems]) => {
      const grid = generateGrid({ width, totalItems });
      const engine = new LayoutEngine(grid);
      const executionTime = measure(() => engine.insert(generateInsert(grid, "*", { maxWidth: 2, maxHeight: 4 })));
      maxTime = Math.max(maxTime, executionTime);
    })
  );
  const averageTime = totalTime / TOTAL_RUNS;

  console.log(
    `[engine-performance.test.ts] Insert resolutions average time: ${averageTime.toFixed(0)}ms, max time: ${maxTime}ms`
  );

  expect(averageTime).toBeLessThan(AVERAGE_EXECUTION_TIME_MS);
  expect(maxTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
});

test("resize resolutions take reasonable time", () => {
  let maxTime = 0;
  const totalTime = measure(() =>
    forEachTimes(TOTAL_RUNS, [[6, 26]], ([width, totalItems]) => {
      const grid = generateGrid({ width, totalItems });
      const engine = new LayoutEngine(grid);
      const executionTime = measure(() =>
        engine.resize(generateResize(grid, { maxHeightIncrement: 4, maxWidthIncrement: 2 }))
      );
      maxTime = Math.max(maxTime, executionTime);
    })
  );
  const averageTime = totalTime / TOTAL_RUNS;

  console.log(
    `[engine-performance.test.ts] Resize resolutions average time: ${averageTime.toFixed(0)}ms, max time: ${maxTime}ms`
  );

  expect(averageTime).toBeLessThan(AVERAGE_EXECUTION_TIME_MS);
  expect(maxTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
});

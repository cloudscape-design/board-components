// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { generateGrid, generateInsert, generateMove, generateResize } from "../../debug-tools";
import { LayoutEngine } from "../engine";
import { Measure, forEachTimes } from "./helpers";

const TOTAL_RUNS = 100;
const AVERAGE_EXECUTION_TIME_MS = 1;
const MAX_EXECUTION_TIME_MS = 25;

function debug(commandName: string, averageTime: number, maxTime: number) {
  const fileName = "[engine-cache.test.ts]";
  console.log(
    `${fileName} ${commandName} second resolutions average time: ${averageTime.toFixed(0)}ms, max time: ${maxTime}ms.`,
  );
}

test("move computations are cached", () => {
  const measure = new Measure();

  forEachTimes(TOTAL_RUNS, [[6, 26]], ([width, totalItems]) => {
    const grid = generateGrid({ width, totalItems });
    const engine = new LayoutEngine(grid);
    const command = generateMove(grid, "any");

    // First run creates cache.
    engine.move(command);
    // Second run uses cache.
    measure.run(() => engine.move(command));
  });

  debug("Move", measure.averageTime, measure.maxTime);
  expect(measure.averageTime).toBeLessThan(AVERAGE_EXECUTION_TIME_MS);
  expect(measure.maxTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
});

test("insert computations are cached", () => {
  const measure = new Measure();

  forEachTimes(TOTAL_RUNS, [[6, 26]], ([width, totalItems]) => {
    const grid = generateGrid({ width, totalItems });
    const engine = new LayoutEngine(grid);
    const command = generateInsert(grid, "*", { maxWidth: 2, maxHeight: 4 });

    // First run creates cache.
    engine.insert(command);
    // Second run uses cache.
    measure.run(() => engine.insert(command));
  });

  debug("Insert", measure.averageTime, measure.maxTime);
  expect(measure.averageTime).toBeLessThan(AVERAGE_EXECUTION_TIME_MS);
  expect(measure.maxTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
});

test("resize computations are cached", () => {
  const measure = new Measure();

  forEachTimes(TOTAL_RUNS, [[6, 26]], ([width, totalItems]) => {
    const grid = generateGrid({ width, totalItems });
    const engine = new LayoutEngine(grid);
    const command = generateResize(grid, { maxHeightIncrement: 4, maxWidthIncrement: 2 });

    // First run creates cache.
    engine.resize(command);
    // Second run uses cache.
    measure.run(() => engine.resize(command));
  });

  debug("Resize", measure.averageTime, measure.maxTime);
  expect(measure.averageTime).toBeLessThan(AVERAGE_EXECUTION_TIME_MS);
  expect(measure.maxTime).toBeLessThan(MAX_EXECUTION_TIME_MS);
});

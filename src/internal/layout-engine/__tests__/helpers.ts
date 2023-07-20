// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";

export function forEachTimes<T>(times: number, array: T[], callback: (item: T) => void) {
  array.flatMap((item) => range(0, times).map(() => item)).forEach(callback);
}

export class Measure {
  public maxTime = 0;
  public totalTime = 0;
  public totalRuns = 0;
  public averageTime = 0;

  run(fn: () => void) {
    const timeBefore = Date.now();
    fn();
    const timeAfter = Date.now();

    this.maxTime = Math.max(this.maxTime, timeAfter - timeBefore);
    this.totalTime += timeAfter - timeBefore;
    this.totalRuns += 1;
    this.averageTime = this.totalTime / this.totalRuns;
  }
}

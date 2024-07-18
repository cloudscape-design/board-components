// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";

import { zipTwoArrays } from "../zip-arrays";

test("zips arrays of same lengths", () => {
  expect(zipTwoArrays(["A", "B", "C"], [1, 2, 3])).toEqual([
    ["A", 1],
    ["B", 2],
    ["C", 3],
  ]);
});

test("zips arrays of different lengths", () => {
  expect(zipTwoArrays(["A", "B"], [1, 2, 3])).toEqual([
    ["A", 1],
    ["B", 2],
    [undefined, 3],
  ]);
  expect(zipTwoArrays(["A", "B", "C"], [1, 2])).toEqual([
    ["A", 1],
    ["B", 2],
    ["C", undefined],
  ]);
});

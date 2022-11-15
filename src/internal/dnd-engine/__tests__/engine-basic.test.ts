// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { createMoveTestSuite } from "./helpers";

/*
  The below tests ensure simple D&D moves produce logical results that are easy to reason about.
  All tests are defined on 3x3 grid with 1x1 items and no empty spaces.
*/

describe("swap adjacent items", () => {
  test.each([
    createMoveTestSuite(
      "swap E with B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B1",
      [
        ["A", "E", "C"],
        ["D", "B", "F"],
        ["G", "H", "I"],
      ]
    ),
    createMoveTestSuite(
      "swap E with H",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B3",
      [
        ["A", "B", "C"],
        ["D", "H", "F"],
        ["G", "E", "I"],
      ]
    ),
    createMoveTestSuite(
      "swap E with D",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 A2",
      [
        ["A", "B", "C"],
        ["E", "D", "F"],
        ["G", "H", "I"],
      ]
    ),
    createMoveTestSuite(
      "swap E with F",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 C2",
      [
        ["A", "B", "C"],
        ["D", "F", "E"],
        ["G", "H", "I"],
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("replace closest diagonal items", () => {
  test.each([
    createMoveTestSuite(
      "replace A with E via B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B1 A1",
      [
        ["E", "A", "C"],
        ["D", "B", "F"],
        ["G", "H", "I"],
      ]
    ),
    createMoveTestSuite(
      "replace A with E via D",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 A2 A1",
      [
        ["E", "B", "C"],
        ["A", "D", "F"],
        ["G", "H", "I"],
      ]
    ),
    createMoveTestSuite(
      "replace C with E via B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B1 C1",
      [
        ["A", "C", "E"],
        ["D", "B", "F"],
        ["G", "H", "I"],
      ]
    ),
    createMoveTestSuite(
      "replace C with E via F",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 C2 C1",
      [
        ["A", "B", "E"],
        ["D", "F", "C"],
        ["G", "H", "I"],
      ]
    ),
    createMoveTestSuite(
      "replace G with E via G",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B3 A3",
      [
        ["A", "B", "C"],
        ["D", "H", "F"],
        ["E", "G", "I"],
      ]
    ),
    createMoveTestSuite(
      "replace G with E via D",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 A2 A3",
      [
        ["A", "B", "C"],
        ["G", "D", "F"],
        ["E", "H", "I"],
      ]
    ),
    createMoveTestSuite(
      "replace I with E via H",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B3 C3",
      [
        ["A", "B", "C"],
        ["D", "H", "F"],
        ["G", "I", "E"],
      ]
    ),
    createMoveTestSuite(
      "replace I with E via F",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 C2 C3",
      [
        ["A", "B", "C"],
        ["D", "F", "I"],
        ["G", "H", "E"],
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("swap distant items", () => {
  test.each([
    createMoveTestSuite(
      "swap H with E,B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B3 B2 B1",
      [
        ["A", "H", "C"],
        ["D", "B", "F"],
        ["G", "E", "I"],
      ]
    ),
    createMoveTestSuite(
      "swap B with E,H",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B1 B2 B3",
      [
        ["A", "E", "C"],
        ["D", "H", "F"],
        ["G", "B", "I"],
      ]
    ),
    createMoveTestSuite(
      "swap D with E,F",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "A2 B2 C2",
      [
        ["A", "B", "C"],
        ["E", "F", "D"],
        ["G", "H", "I"],
      ]
    ),
    createMoveTestSuite(
      "swap F with E,D",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "C2 B2 A2",
      [
        ["A", "B", "C"],
        ["F", "D", "E"],
        ["G", "H", "I"],
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("replace distant diagonal items", () => {
  test.each([
    createMoveTestSuite(
      "replace I with A",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "A1 B1 B2 B3 C3",
      [
        ["B", "E", "C"],
        ["D", "H", "F"],
        ["G", "I", "A"],
      ]
    ),
    createMoveTestSuite(
      "replace A with I",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "C3 C2 C1 B1 A1",
      [
        ["I", "A", "B"],
        ["D", "E", "C"],
        ["G", "H", "F"],
      ]
    ),
    createMoveTestSuite(
      "replace C with G",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "A3 B3 B2 C2 C1",
      [
        ["A", "B", "G"],
        ["D", "F", "C"],
        ["H", "E", "I"],
      ]
    ),
    createMoveTestSuite(
      "replace G with C",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "C1 C2 B2 A2 A3",
      [
        ["A", "B", "F"],
        ["G", "D", "E"],
        ["C", "H", "I"],
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("replace arbitrary items", () => {
  test.each([
    createMoveTestSuite(
      "replace F with G",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "A3 A2 B2 C2",
      [
        ["A", "B", "C"],
        ["E", "F", "G"],
        ["D", "H", "I"],
      ]
    ),
    createMoveTestSuite(
      "replace I with B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B1 B2 C2 C3",
      [
        ["A", "E", "C"],
        ["D", "F", "I"],
        ["G", "H", "B"],
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

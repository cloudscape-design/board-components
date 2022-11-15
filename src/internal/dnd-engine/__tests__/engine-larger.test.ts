// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { test, expect, describe } from "vitest";
import { createMoveTestSuite } from "./helpers";

/*
  The below tests ensure D&D moves on larger items work as expected.
*/

describe("vertical swaps of larger items", () => {
  test.each([
    createMoveTestSuite(
      "swap E with G",
      [
        ["A", "B", "C"],
        ["D", "E", "E"],
        ["G", "G", "I"],
      ],
      "B2 B3",
      [
        ["A", "B", "C"],
        ["D", " ", "I"],
        [" ", "E", "E"],
        ["G", "G", " "],
      ]
    ),
    createMoveTestSuite(
      "swap B with H",
      [
        ["A", "B", "B"],
        ["D", "E", "F"],
        ["G", "H", "H"],
      ],
      "C1 C2 C3",
      [
        ["A", "E", "F"],
        ["D", "H", "H"],
        ["G", "B", "B"],
      ]
    ),
    createMoveTestSuite(
      "swap A with G",
      [
        ["A", "A", "A"],
        ["D", "E", "E"],
        ["G", "G", "H"],
      ],
      "B1 B2 B3",
      [
        ["D", "E", "E"],
        ["G", "G", "H"],
        ["A", "A", "A"],
      ]
    ),
    createMoveTestSuite(
      "swap A with H",
      [
        ["A", "A", " "],
        [" ", "E", "E"],
        ["G", "G", " "],
        [" ", "H", "H"],
      ],
      "A1 A2 A3 A4",
      [
        [" ", "E", "E"],
        ["G", "G", " "],
        [" ", "H", "H"],
        ["A", "A", " "],
      ]
    ),
    createMoveTestSuite(
      "swap C with A",
      [
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["B", "C", "C"],
      ],
      "C3 C2 C1",
      [
        ["B", "C", "C"],
        ["A", "A", "A"],
        ["A", "A", "A"],
      ]
    ),
    createMoveTestSuite(
      "swap A with C",
      [
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["B", "C", "C"],
      ],
      "B2 B3",
      [
        ["B", "C", "C"],
        ["A", "A", "A"],
        ["A", "A", "A"],
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("horizontal swaps of larger items", () => {
  test.each([
    createMoveTestSuite(
      "swap F and H",
      [
        ["A", "B", "C", "D"],
        ["F", "E", "E", "H"],
        ["G", "G", "I", "H"],
      ],
      "A2 B2 C2 D2",
      [
        ["A", "B", "C", "D"],
        ["E", "E", "I", "F"],
        ["G", "G", " ", "H"],
        [" ", " ", " ", "H"],
      ]
    ),
    createMoveTestSuite(
      "swap A and B",
      [
        ["A", "A", "C", "B", "B"],
        ["A", "A", "D", "B", "B"],
        ["A", "A", "E", "F", "G"],
      ],
      "B2 C2 D2 E2",
      [
        ["C", "B", "B", "A", "A"],
        ["D", "B", "B", "A", "A"],
        ["E", "F", "G", "A", "A"],
      ]
    ),
    createMoveTestSuite(
      "swap K and B",
      [
        [" ", "K", "C", "B", "B"],
        [" ", "K", "D", "B", "B"],
        [" ", "K", "E", "F", "G"],
      ],
      "B2 C2 D2 E2",
      [
        [" ", "C", "B", "B", "K"],
        [" ", "D", "B", "B", "K"],
        [" ", "E", "F", "G", "K"],
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("diagonal swaps of larger items", () => {
  test.each([
    createMoveTestSuite(
      "swap A and D via B",
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", "D", "D"],
        ["C", "C", "D", "D"],
      ],
      "B2 C2 D2 D3 D4",
      [
        ["B", "B", "D", "D"],
        ["B", "B", "D", "D"],
        ["C", "C", "A", "A"],
        ["C", "C", "A", "A"],
      ]
    ),
    createMoveTestSuite(
      "swap A and D via C",
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", "D", "D"],
        ["C", "C", "D", "D"],
      ],
      "A1 A2 A3 B3 C3",
      [
        ["C", "C", "B", "B"],
        ["C", "C", "B", "B"],
        ["D", "D", "A", "A"],
        ["D", "D", "A", "A"],
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("replacement moves of larger items", () => {
  test.each([
    createMoveTestSuite(
      "move A to D touching C",
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", "D", "D"],
        ["C", "C", "D", "D"],
      ],
      "B2 C2 C3 C4 D4",
      [
        ["C", "C", "B", "B"],
        ["C", "C", "B", "B"],
        [" ", " ", "A", "A"],
        [" ", " ", "A", "A"],
        [" ", " ", "D", "D"],
        [" ", " ", "D", "D"],
      ]
    ),
    createMoveTestSuite(
      "move A to D touching B",
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", "D", "D"],
        ["C", "C", "D", "D"],
      ],
      "B2 B3 C3 D3 D4 D5",
      [
        ["B", "B", "D", "D"],
        ["B", "B", "D", "D"],
        ["C", "C", "A", "A"],
        ["C", "C", "A", "A"],
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

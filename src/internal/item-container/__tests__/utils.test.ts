// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, Mock, test, vi } from "vitest";

import { getLogicalClientX as originalGetLogicalClientX } from "@cloudscape-design/component-toolkit/internal";

import type { Transition } from "../../../../lib/components/internal/item-container";
import { determineHandleActiveState } from "../../../../lib/components/internal/item-container/utils";
import type { Operation } from "../../dnd-controller/controller";
import { Coordinates } from "../../utils/coordinates";
import { calculateInitialPointerData, DetermineHandleActiveStateArgs, getDndOperationType } from "../utils";

const mockRect = {
  insetInlineStart: 10,
  insetBlockStart: 20,
  insetInlineEnd: 110, // 10 + 100 (width)
  insetBlockEnd: 120, // 20 + 100 (height)
  inlineSize: 100,
  blockSize: 100,
  left: 10,
  right: 110,
  top: 20,
  bottom: 120,
  width: 100,
  height: 100,
  x: 10,
  y: 20,
};

const mockPointerEvent = (clientX: number, clientY: number): Partial<PointerEvent> => ({
  clientX,
  clientY,
});

vi.mock("@cloudscape-design/component-toolkit/internal", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    getLogicalClientX: vi.fn(),
  };
});
const mockGetLogicalClientX = originalGetLogicalClientX as Mock;

describe("getDndOperationType", () => {
  interface TestCases {
    operation: "drag" | "resize";
    isPlaced: boolean;
    expected: Operation;
    description: string;
  }

  const testCases: Array<TestCases> = [
    { operation: "resize", isPlaced: true, expected: "resize", description: "resize when placed" },
    {
      operation: "resize",
      isPlaced: false,
      expected: "resize",
      description: "resize when not placed (should still be resize)",
    },
    { operation: "drag", isPlaced: true, expected: "reorder", description: "reorder when drag and placed" },
    { operation: "drag", isPlaced: false, expected: "insert", description: "insert when drag and not placed" },
  ];

  test.each(testCases)('should return "$expected" for $description', ({ operation, isPlaced, expected }) => {
    expect(getDndOperationType(operation, isPlaced)).toBe<Operation>(expected);
  });
});

describe("calculateInitialPointerData", () => {
  const getMinSizeMock = vi.fn();
  const MOCK_DOCUMENT_CLIENT_WIDTH = 1000; // For RTL simulation

  beforeEach(() => {
    getMinSizeMock.mockReset();
    mockGetLogicalClientX.mockReset();
  });

  describe('when operation is "drag"', () => {
    test("should calculate pointerOffset from top-left and null boundaries for LTR", () => {
      mockGetLogicalClientX.mockImplementation((event: PointerEvent) => event.clientX);
      const event = mockPointerEvent(50, 60) as PointerEvent;
      const result = calculateInitialPointerData({
        event,
        operation: "drag",
        rect: mockRect,
        getMinSize: getMinSizeMock,
        isRtl: false,
      });
      expect(mockGetLogicalClientX).toHaveBeenCalledWith(event, false);

      const expectedPointerOffsetX = event.clientX - mockRect.insetInlineStart; // 50 - 10 = 40
      const expectedPointerOffsetY = event.clientY - mockRect.insetBlockStart; // 60 - 20 = 40
      expect(result.pointerOffset).toEqual(new Coordinates({ x: expectedPointerOffsetX, y: expectedPointerOffsetY }));
      expect(result.pointerBoundaries).toBeNull();
      expect(getMinSizeMock).not.toHaveBeenCalled();
    });

    test("should calculate pointerOffset from top-left and null boundaries for RTL", () => {
      mockGetLogicalClientX.mockImplementation((event: PointerEvent) => MOCK_DOCUMENT_CLIENT_WIDTH - event.clientX);
      const event = mockPointerEvent(950, 60) as PointerEvent;
      const result = calculateInitialPointerData({
        event,
        operation: "drag",
        rect: mockRect,
        getMinSize: getMinSizeMock,
        isRtl: true,
      });
      expect(mockGetLogicalClientX).toHaveBeenCalledWith(event, true);

      const logicalClientX = MOCK_DOCUMENT_CLIENT_WIDTH - event.clientX; // 1000 - 950 = 50
      const expectedPointerOffsetX = logicalClientX - mockRect.insetInlineStart; // 50 - 10 = 40
      const expectedPointerOffsetY = event.clientY - mockRect.insetBlockStart; // 60 - 20 = 40
      expect(result.pointerOffset).toEqual(new Coordinates({ x: expectedPointerOffsetX, y: expectedPointerOffsetY }));
      expect(result.pointerBoundaries).toBeNull();
      expect(getMinSizeMock).not.toHaveBeenCalled();
    });
  });

  describe('when operation is "resize"', () => {
    const minWidth = 50;
    const minHeight = 50;

    beforeEach(() => {
      getMinSizeMock.mockReturnValue({ minWidth, minHeight });
    });

    test("should calculate pointerOffset from bottom-right and boundaries for LTR", () => {
      mockGetLogicalClientX.mockImplementation((event: PointerEvent) => event.clientX);
      const event = mockPointerEvent(150, 160) as PointerEvent; // Pointer beyond item
      const result = calculateInitialPointerData({
        event,
        operation: "resize",
        rect: mockRect,
        getMinSize: getMinSizeMock,
        isRtl: false,
      });

      expect(mockGetLogicalClientX).toHaveBeenCalledWith(event, false);
      expect(getMinSizeMock).toHaveBeenCalledTimes(1);

      const expectedPointerOffsetX = event.clientX - mockRect.insetInlineEnd; // 150 - 110 = 40
      const expectedPointerOffsetY = event.clientY - mockRect.insetBlockEnd; // 160 - 120 = 40
      expect(result.pointerOffset).toEqual(new Coordinates({ x: expectedPointerOffsetX, y: expectedPointerOffsetY }));

      const expectedBoundaryX = event.clientX - mockRect.inlineSize + minWidth; // 150 - 100 + 50 = 100
      const expectedBoundaryY = event.clientY - mockRect.blockSize + minHeight; // 160 - 100 + 50 = 110
      expect(result.pointerBoundaries).toEqual(new Coordinates({ x: expectedBoundaryX, y: expectedBoundaryY }));
    });

    test("should calculate pointerOffset from bottom-right and boundaries for RTL", () => {
      mockGetLogicalClientX.mockImplementation((event: PointerEvent) => MOCK_DOCUMENT_CLIENT_WIDTH - event.clientX);
      const event = mockPointerEvent(850, 160) as PointerEvent;
      const result = calculateInitialPointerData({
        event,
        operation: "resize",
        rect: mockRect,
        getMinSize: getMinSizeMock,
        isRtl: true,
      });

      expect(mockGetLogicalClientX).toHaveBeenCalledWith(event, true);
      expect(getMinSizeMock).toHaveBeenCalledTimes(1);

      const logicalClientX = MOCK_DOCUMENT_CLIENT_WIDTH - event.clientX; // 1000 - 850 = 150
      const expectedPointerOffsetX = logicalClientX - mockRect.insetInlineEnd; // 150 - 110 = 40
      const expectedPointerOffsetY = event.clientY - mockRect.insetBlockEnd; // 160 - 120 = 40
      expect(result.pointerOffset).toEqual(new Coordinates({ x: expectedPointerOffsetX, y: expectedPointerOffsetY }));

      const expectedBoundaryX = logicalClientX - mockRect.inlineSize + minWidth; // 150 - 100 + 50 = 100
      const expectedBoundaryY = event.clientY - mockRect.blockSize + minHeight; // 160 - 100 + 50 = 110
      expect(result.pointerBoundaries).toEqual(new Coordinates({ x: expectedBoundaryX, y: expectedBoundaryY }));
    });
  });
});

describe("determineHandleActiveState", () => {
  const mockTransition = (operation: Operation): Transition => ({
    itemId: "test-item",
    operation: operation,
    interactionType: "pointer", // Default value while testing, doesn't affect function's logic
    sizeTransform: null,
    positionTransform: null,
  });

  type InteractionHookValue = DetermineHandleActiveStateArgs["interactionHookValue"];

  const activeStateTestCases: Array<{
    description: string;
    args: Partial<DetermineHandleActiveStateArgs>;
    expected: "pointer" | "uap" | null;
    targetOperation?: Operation;
  }> = [
    // "pointer" states
    {
      description: 'return "pointer" if globally active, resize transition, dnd-start',
      args: {
        isHandleActive: true,
        currentTransition: mockTransition("resize"),
        interactionHookValue: "dnd-start",
        targetOperation: "resize",
      },
      expected: "pointer",
    },
    {
      description: 'return "pointer" if globally active, reorder transition, dnd-start',
      args: {
        isHandleActive: true,
        currentTransition: mockTransition("reorder"),
        interactionHookValue: "dnd-start",
        targetOperation: "reorder",
      },
      expected: "pointer",
    },
    // "uap" states
    {
      description: 'return "uap" if globally active, resize transition, uap-action-start',
      args: {
        isHandleActive: true,
        currentTransition: mockTransition("resize"),
        interactionHookValue: "uap-action-start",
        targetOperation: "resize",
      },
      expected: "uap",
    },
    {
      description: 'return "uap" if globally active, reorder transition, uap-action-start',
      args: {
        isHandleActive: true,
        currentTransition: mockTransition("reorder"),
        interactionHookValue: "uap-action-start",
        targetOperation: "reorder",
      },
      expected: "uap",
    },
    // Null states
    {
      description: "return null if not globally active",
      args: {
        isHandleActive: false,
        currentTransition: mockTransition("resize"),
        interactionHookValue: "dnd-start",
        targetOperation: "resize",
      },
      expected: null,
    },
    {
      description: "return null if no current transition",
      args: {
        isHandleActive: true,
        currentTransition: null,
        interactionHookValue: "dnd-start",
        targetOperation: "resize",
      },
      expected: null,
    },
    {
      description: "return null if current transition operation mismatches target",
      args: {
        isHandleActive: true,
        currentTransition: mockTransition("reorder"),
        interactionHookValue: "dnd-start",
        targetOperation: "resize",
      },
      expected: null,
    },
    {
      description: 'return null if interaction hook is not "dnd-start" or "uap-action-start" (e.g., "dnd-active")',
      args: {
        isHandleActive: true,
        currentTransition: mockTransition("resize"),
        interactionHookValue: "dnd-active",
        targetOperation: "resize",
      },
      expected: null,
    },
    {
      description: "return null if interaction hook is null",
      args: {
        isHandleActive: true,
        currentTransition: mockTransition("resize"),
        interactionHookValue: null,
        targetOperation: "resize",
      },
      expected: null,
    },
    {
      description: "return null if interaction hook is undefined",
      args: {
        isHandleActive: true,
        currentTransition: mockTransition("resize"),
        interactionHookValue: undefined as unknown as InteractionHookValue,
        targetOperation: "resize",
      },
      expected: null,
    },
    {
      description: "return null if interaction hook is an arbitrary string",
      args: {
        isHandleActive: true,
        currentTransition: mockTransition("resize"),
        interactionHookValue: "some-other-state" as InteractionHookValue,
        targetOperation: "resize",
      },
      expected: null,
    },
    // Combined null conditions
    {
      description: 'return null if not globally active, even if other conditions match for "pointer"',
      args: {
        isHandleActive: false,
        currentTransition: mockTransition("resize"),
        interactionHookValue: "dnd-start",
        targetOperation: "resize",
      },
      expected: null,
    },
    {
      description: 'return null if not globally active, even if other conditions match for "uap"',
      args: {
        isHandleActive: false,
        currentTransition: mockTransition("resize"),
        interactionHookValue: "uap-action-start",
        targetOperation: "resize",
      },
      expected: null,
    },
  ];

  test.each(activeStateTestCases)("should $description", ({ args, expected }) => {
    expect(determineHandleActiveState(args as DetermineHandleActiveStateArgs)).toBe(expected);
  });
});

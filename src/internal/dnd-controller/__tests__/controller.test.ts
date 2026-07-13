// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useDraggable } from "../../../../lib/components/internal/dnd-controller/controller";

describe("controller idempotent guards", () => {
  const draggableItem = { id: "item-1", data: {} };
  const getCollisionRect = () => ({ top: 0, bottom: 100, left: 0, right: 100 });

  test("submitTransition is a no-op when no transition is active", () => {
    const { result } = renderHook(() => useDraggable({ draggableItem, getCollisionRect }));
    expect(() => result.current.submitTransition()).not.toThrow();
  });

  test("discardTransition is a no-op when no transition is active", () => {
    const { result } = renderHook(() => useDraggable({ draggableItem, getCollisionRect }));
    expect(() => result.current.discardTransition()).not.toThrow();
  });
});

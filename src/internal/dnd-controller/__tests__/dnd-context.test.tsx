// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  DragAndDropController,
  DropTargetContext,
  useDndController,
} from "../../../../lib/components/internal/dnd-controller/controller";
import { DndContextProvider } from "../../../../lib/components/internal/dnd-controller/dnd-context";

function renderController(wrapper?: ({ children }: { children: ReactNode }) => JSX.Element) {
  return renderHook(() => useDndController(), { wrapper }).result.current;
}

describe("DnD context isolation", () => {
  test("returns the shared global controller when no provider is present", () => {
    const a = renderController();
    const b = renderController();
    expect(a).toBeInstanceOf(DragAndDropController);
    // Both no-provider consumers resolve to the same shared singleton (backwards compatible).
    expect(a).toBe(b);
  });

  test("provides a dedicated controller per provider instance", () => {
    const wrapperA = ({ children }: { children: ReactNode }) => <DndContextProvider>{children}</DndContextProvider>;
    const wrapperB = ({ children }: { children: ReactNode }) => <DndContextProvider>{children}</DndContextProvider>;

    const controllerA = renderController(wrapperA);
    const controllerB = renderController(wrapperB);

    expect(controllerA).toBeInstanceOf(DragAndDropController);
    expect(controllerB).toBeInstanceOf(DragAndDropController);
    // Separate providers => isolated controllers (independent Board instances).
    expect(controllerA).not.toBe(controllerB);
    // A provider isolates from the global singleton too.
    expect(controllerA).not.toBe(renderController());
  });

  test("keeps a stable controller across re-renders of the same provider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <DndContextProvider>{children}</DndContextProvider>;
    const { result, rerender } = renderHook(() => useDndController(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("DragAndDropController droppable registry isolation", () => {
  const context: DropTargetContext = { scale: () => ({ width: 0, height: 0 }) };

  test("droppables registered on one controller are not visible to another", () => {
    const controllerA = new DragAndDropController();
    const controllerB = new DragAndDropController();

    controllerA.addDroppable("a-1", context, document.createElement("div"));

    expect(controllerA.getDroppables().map(([id]) => id)).toEqual(["a-1"]);
    // The second controller has an independent registry, so cross-board collisions cannot happen.
    expect(controllerB.getDroppables()).toEqual([]);
  });
});

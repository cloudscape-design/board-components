// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { StrictMode, useRef } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  useBoardTransfer,
  useDraggable,
  useDragSubscription,
  useDroppable,
} from "../../../../lib/components/internal/dnd-controller/controller";
import { BoardItemDefinitionBase, Rect } from "../../../../lib/components/internal/interfaces";
import { Coordinates } from "../../../../lib/components/internal/utils/coordinates";

afterEach(cleanup);

const draggableItem: BoardItemDefinitionBase<unknown> = { id: "draggable", data: {}, definition: {} };
// An empty collision rect keeps collision detection a no-op so the tests focus on subscription and
// droppable registration rather than the collision math.
const collisionRect: Rect = { top: 0, bottom: 0, left: 0, right: 0 };

// Registers a droppable and exposes a way to read the droppables visible to a draggable. The d&d
// controller is a page-global singleton, so every actor rendered in a test shares it.
function DndActor({
  droppableId,
  onStart,
  exposeDroppables,
}: {
  droppableId: string;
  onStart?: () => void;
  exposeDroppables?: (ids: string[]) => void;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  useDroppable({
    itemId: droppableId,
    context: { scale: () => ({ width: 1, height: 1 }) },
    getElement: () => elementRef.current!,
  });

  const draggable = useDraggable({ draggableItem, getCollisionRect: () => collisionRect });

  useDragSubscription("start", () => {
    onStart?.();
    exposeDroppables?.(draggable.getDroppables().map(([id]) => String(id)));
  });

  return (
    <div>
      <div ref={elementRef} />
      <button
        data-testid={`start-${droppableId}`}
        onClick={() => draggable.start("reorder", "keyboard", new Coordinates({ x: 0, y: 0 }))}
      >
        start
      </button>
    </div>
  );
}

describe("shared controller", () => {
  test("all components share the singleton controller and receive broadcasts", () => {
    const startA = vi.fn();
    const startB = vi.fn();
    let droppablesSeenByA: string[] = [];

    render(
      <>
        <DndActor droppableId="a" onStart={startA} exposeDroppables={(ids) => (droppablesSeenByA = ids.sort())} />
        <DndActor droppableId="b" onStart={startB} />
      </>,
    );

    (document.querySelector('[data-testid="start-a"]') as HTMLButtonElement).click();

    // The singleton controller broadcasts to every subscriber, which preserves the legacy
    // Board + ItemsPalette sibling behavior. Isolation between multiple boards is achieved at the
    // board level (scoped placeholder ids + event/collision filtering), not by separate controllers.
    expect(startA).toHaveBeenCalledTimes(1);
    expect(startB).toHaveBeenCalledTimes(1);

    // The draggable sees both droppables registered in the shared controller.
    expect(droppablesSeenByA).toEqual(["a", "b"]);
  });
});

describe("useBoardTransfer", () => {
  test("getDroppables returns all registered droppables", () => {
    let droppables: [string, unknown][] = [];

    function TransferConsumer() {
      const transfer = useBoardTransfer();
      useDragSubscription("start", () => {
        droppables = transfer.getDroppables().map(([id, entry]) => [String(id), entry]);
      });
      return null;
    }

    render(
      <>
        <DndActor droppableId="x" />
        <DndActor droppableId="y" />
        <TransferConsumer />
      </>,
    );

    (document.querySelector('[data-testid="start-x"]') as HTMLButtonElement).click();
    const ids = droppables.map(([id]) => id).sort();
    expect(ids).toEqual(["x", "y"]);
  });

  test("acquire triggers the acquire event on the shared controller", () => {
    const acquireHandler = vi.fn();

    function AcquireListener() {
      useDragSubscription("acquire", acquireHandler);
      return null;
    }

    function AcquireInitiator() {
      const transfer = useBoardTransfer();
      return (
        <button data-testid="do-acquire" onClick={() => transfer.acquire("target-drop", () => <span>acquired</span>)}>
          acquire
        </button>
      );
    }

    render(
      <>
        <DndActor droppableId="target-drop" />
        <AcquireListener />
        <AcquireInitiator />
      </>,
    );

    // Start a transition first (acquire is a no-op on the controller if there's no active transition,
    // but the event emitter still fires).
    (document.querySelector('[data-testid="start-target-drop"]') as HTMLButtonElement).click();
    (document.querySelector('[data-testid="do-acquire"]') as HTMLButtonElement).click();

    expect(acquireHandler).toHaveBeenCalledWith(expect.objectContaining({ droppableId: "target-drop" }));
  });
});

describe("droppable lifecycle", () => {
  test("unmounting a component unregisters its droppable", () => {
    let droppablesSeenByA: string[] = [];

    function App({ showB }: { showB: boolean }) {
      return (
        <>
          <DndActor droppableId="a" exposeDroppables={(ids) => (droppablesSeenByA = ids.sort())} />
          {showB ? <DndActor droppableId="b" /> : null}
        </>
      );
    }

    const { rerender } = render(<App showB={true} />);

    // Both droppables are registered.
    (document.querySelector('[data-testid="start-a"]') as HTMLButtonElement).click();
    expect(droppablesSeenByA).toEqual(["a", "b"]);

    // Unmount the "b" subtree; its droppable must be cleaned up (no stale/leaked entry).
    rerender(<App showB={false} />);
    (document.querySelector('[data-testid="start-a"]') as HTMLButtonElement).click();
    expect(droppablesSeenByA).toEqual(["a"]);
  });

  test("under StrictMode double-mount, droppables are not duplicated or stranded", () => {
    let droppablesSeenByA: string[] = [];

    // StrictMode intentionally mounts, unmounts, and re-mounts effects in development. The
    // addDroppable/removeDroppable effect must be balanced so a droppable is registered exactly
    // once after the dust settles (a duplicate or a stranded entry would show up here).
    render(
      <StrictMode>
        <DndActor droppableId="a" exposeDroppables={(ids) => (droppablesSeenByA = ids.sort())} />
        <DndActor droppableId="b" />
      </StrictMode>,
    );

    (document.querySelector('[data-testid="start-a"]') as HTMLButtonElement).click();
    expect(droppablesSeenByA).toEqual(["a", "b"]);
  });
});

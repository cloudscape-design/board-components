// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";

import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

import { Board, BoardItem, type BoardProps } from "../../lib/components";

// Minimal repro of the board drag freeze: grab a widget's drag handle, flick it
// across the board and let go immediately. When it reproduces, the widget stays
// hovering, the cursor stays in the drag state and the page only scrolls.
//
// The two knobs below are what make it reproducible: the window the bug needs
// is the gap between the pointermove render and React flushing its effects, and
// slow widgets that keep re-rendering (as they do when data streams in) make
// that gap wide. Lower them and the freeze gets rarer.

/** Milliseconds each widget spends rendering. */
const RENDER_COST_MS = 40;

/** How often the widgets re-render, standing in for streamed data. */
const UPDATE_INTERVAL_MS = 100;

/** Classes board-components puts on <body> while a pointer drag is in flight. */
const DRAGGING = /^awsui_(show-grab-cursor|show-resize-cursor|disable-selection)_/;

function isBoardDragging() {
  return Array.from(document.body.classList).some((cls) => DRAGGING.test(cls));
}

function burnCpu(ms: number) {
  const until = performance.now() + ms;
  // eslint-disable-next-line no-empty
  while (performance.now() < until) {}
}

const initialItems: BoardProps.Item<{ title: string }>[] = [
  { id: "one", rowSpan: 3, columnSpan: 2, data: { title: "Widget 1" } },
  { id: "two", rowSpan: 3, columnSpan: 2, data: { title: "Widget 2" } },
  { id: "three", rowSpan: 3, columnSpan: 2, data: { title: "Widget 3" } },
  { id: "four", rowSpan: 3, columnSpan: 2, data: { title: "Widget 4" } },
];

export default function BoardFreezeMinimalPage() {
  const [items, setItems] = useState(initialItems);
  const [frozen, setFrozen] = useState(false);
  const [commits, setCommits] = useState(0);
  const [tick, setTick] = useState(0);

  // Keeps the widgets re-rendering, like data streaming into them.
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), UPDATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  // After every pointer release, the board should have submitted or discarded
  // its transition. If it is still dragging, it never learned the drag ended.
  useEffect(() => {
    function onPointerUp() {
      if (!isBoardDragging()) {
        return;
      }
      window.setTimeout(() => setFrozen(isBoardDragging()), 300);
    }
    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, []);

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Grab a widget by its drag handle, flick it across the board and release immediately. Repeat a few times; it is a race, so it does not happen on every try."
          actions={<Button onClick={() => window.location.reload()}>Reload page</Button>}
        >
          Board drag freeze
        </Header>
      }
    >
      <SpaceBetween size="l">
        {frozen ? (
          <Alert type="error" header="Frozen">
            The pointer was released but the board is still dragging: it never submitted the transition, so the widget
            keeps hovering and the page stays unclickable. Reload to recover.
          </Alert>
        ) : (
          <StatusIndicator type="success">Not frozen. Drags committed: {commits}</StatusIndicator>
        )}

        <Board
          items={items}
          empty={<Box textAlign="center">No widgets</Box>}
          onItemsChange={({ detail }) => {
            setItems(detail.items as BoardProps.Item<{ title: string }>[]);
            setCommits((count) => count + 1);
          }}
          i18nStrings={{
            liveAnnouncementDndStarted: (operation) => `Started ${operation}`,
            liveAnnouncementDndItemReordered: () => "Item moved",
            liveAnnouncementDndItemResized: () => "Item resized",
            liveAnnouncementDndItemInserted: () => "Item inserted",
            liveAnnouncementDndCommitted: (operation) => `${operation} committed`,
            liveAnnouncementDndDiscarded: (operation) => `${operation} discarded`,
            liveAnnouncementItemRemoved: (operation) => `Removed ${operation.item.data.title}`,
            navigationAriaLabel: "Board navigation",
            navigationItemAriaLabel: (item) => (item ? item.data.title : "Empty"),
          }}
          renderItem={(item) => (
            <BoardItem
              header={<Header variant="h2">{item.data.title}</Header>}
              i18nStrings={{
                dragHandleAriaLabel: `Drag handle, ${item.data.title}`,
                resizeHandleAriaLabel: `Resize handle, ${item.data.title}`,
              }}
            >
              <Widget title={item.data.title} tick={tick} />
            </BoardItem>
          )}
        />
      </SpaceBetween>
    </ContentLayout>
  );
}

/** Stands in for real widget content by being slow to render. */
function Widget({ title, tick }: { title: string; tick: number }) {
  burnCpu(RENDER_COST_MS);
  return (
    <Box variant="p">
      {title} &middot; update {tick}
    </Box>
  );
}

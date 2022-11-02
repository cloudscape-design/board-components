// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Canvas from "../../lib/components/canvas";
import { CanvasLayoutItem } from "../../lib/components/internal/layout";
import { TestBed } from "../app/test-bed";
import classnames from "./layouts.module.css";

const singleItem: CanvasLayoutItem[] = [
  {
    id: "1",
    columnSpan: 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 1,
    data: {},
  },
];

const spacedOutTtems: CanvasLayoutItem[] = [
  {
    id: "1",
    columnSpan: 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 1,
    data: {},
  },
  {
    id: "2",
    columnSpan: 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 4,
    data: {},
  },
];

const nextRowItems: CanvasLayoutItem[] = [
  {
    id: "1",
    columnSpan: 2,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 1,
    data: {},
  },
  {
    id: "2",
    columnSpan: 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 1,
    data: {},
  },
];

const noop = () => {
  /* readonly demos */
};

export default function CanvasPage() {
  return (
    <>
      <h1>Canvas</h1>
      <main>
        <TestBed>
          <Canvas items={singleItem} renderItem={(item) => <Block key={item.id} />} onItemsChange={noop} />
        </TestBed>
        <TestBed>
          <Canvas items={spacedOutTtems} renderItem={(item) => <Block key={item.id} />} onItemsChange={noop} />
        </TestBed>
        <TestBed>
          <Canvas items={nextRowItems} renderItem={(item) => <Block key={item.id} />} onItemsChange={noop} />
        </TestBed>
      </main>
    </>
  );
}

function Block() {
  return <div className={classnames.block} />;
}

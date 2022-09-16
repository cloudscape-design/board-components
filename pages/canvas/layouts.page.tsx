// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from "react";
import Canvas, { CanvasItem } from "../../lib/components/canvas";
import { TestBed } from "../app/test-bed";
import classnames from "./layouts.module.css";

const singleItem: CanvasItem[] = [
  { id: "1", columnSpan: 1, rowSpan: 1, definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, columnOffset: 1 },
];

const spacedOutTtems: CanvasItem[] = [
  { id: "1", columnSpan: 1, rowSpan: 1, definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, columnOffset: 1 },
  { id: "2", columnSpan: 1, rowSpan: 1, definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, columnOffset: 4 },
];

const nextRowItems: CanvasItem[] = [
  { id: "1", columnSpan: 2, rowSpan: 1, definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, columnOffset: 1 },
  { id: "2", columnSpan: 1, rowSpan: 1, definition: { defaultColumnSpan: 1, defaultRowSpan: 1 }, columnOffset: 1 },
];

export default function CanvasPage() {
  return (
    <>
      <h1>Canvas</h1>
      <main>
        <TestBed>
          <Canvas items={singleItem} renderItem={(item) => <Block key={item.id} />} />
        </TestBed>
        <TestBed>
          <Canvas items={spacedOutTtems} renderItem={(item) => <Block key={item.id} />} />
        </TestBed>
        <TestBed>
          <Canvas items={nextRowItems} renderItem={(item) => <Block key={item.id} />} />
        </TestBed>
      </main>
    </>
  );
}

function Block() {
  return <div className={classnames.block} />;
}

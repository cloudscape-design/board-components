// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { EnginePage } from "./engine.page";
import { createLetterItems, letterWidgets } from "./items";

const letterItems = createLetterItems([
  ["A", "B", "C", "D"],
  ["E", "F", "G", "H"],
  ["I", "J", "K", "L"],
  ["M", "N", "O", "P"],
])!;

export default function () {
  return (
    <EnginePage
      initialLayoutItems={letterItems.layoutItems}
      initialPaletteItems={letterItems.paletteItems}
      widgets={letterWidgets}
    />
  );
}

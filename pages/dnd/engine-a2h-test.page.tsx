// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { EnginePageTemplate } from "./engine-page-template";
import { createLetterItems, letterWidgets } from "./items";

const letterItems = createLetterItems([
  ["A", "B", "C", "D"],
  ["E", "F", "G", "H"],
])!;

export default function () {
  return (
    <EnginePageTemplate
      initialLayoutItems={letterItems.layoutItems}
      initialPaletteItems={letterItems.paletteItems}
      widgets={letterWidgets}
    />
  );
}

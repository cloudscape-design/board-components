// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ScreenshotArea } from "../screenshot-area";
import { EnginePageTemplate } from "./engine-page-template";
import { demoLayoutItems, demoPaletteItems, demoWidgets } from "./items";

export default function () {
  return (
    <ScreenshotArea>
      <EnginePageTemplate
        initialLayoutItems={demoLayoutItems}
        initialPaletteItems={demoPaletteItems}
        widgets={demoWidgets}
      />
    </ScreenshotArea>
  );
}

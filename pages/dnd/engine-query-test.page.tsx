// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { EnginePageTemplate } from "./engine-page-template";
import { createLetterItems, letterWidgets } from "./items";

export default function () {
  const [searchParams] = useSearchParams();
  const layoutStr = searchParams.get("layout") ?? "[]";
  const paletteStr = searchParams.get("palette") ?? "[]";

  const letterItems = useMemo(
    () => createLetterItems(safeParseJSON(layoutStr as string, []), safeParseJSON(paletteStr as string, [])),
    [layoutStr, paletteStr]
  );

  return (
    <EnginePageTemplate
      initialLayoutItems={letterItems?.layoutItems ?? []}
      initialPaletteItems={letterItems?.paletteItems ?? []}
      widgets={letterWidgets}
    />
  );
}

function safeParseJSON<T>(value: string, fallback: T) {
  try {
    return JSON.parse(value as string);
  } catch {
    return fallback;
  }
}

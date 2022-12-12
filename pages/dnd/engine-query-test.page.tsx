// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import qs from "qs";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { EnginePageTemplate } from "./engine-page-template";
import { createLetterItems, letterWidgets } from "./items";

export default function () {
  const location = useLocation();

  const letterItems = useMemo(() => {
    const { layout: layoutStr = "[]", palette: paletteStr = "[]" } = qs.parse(location.search.slice(1));
    const layout = safeParseJSON(layoutStr as string, []);
    const palette = safeParseJSON(paletteStr as string, []);
    return createLetterItems(layout, palette);
  }, [location.search]);

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

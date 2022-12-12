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
    const layout = JSON.parse(layoutStr as string);
    const palette = JSON.parse(paletteStr as string);
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

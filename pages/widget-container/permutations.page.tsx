// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from "react";
import WidgetContainer, { WidgetContainerProps } from "../../lib/components/widget-container";

const i18nStrings: WidgetContainerProps["i18nStrings"] = {
  dragHandleLabel: "Drag handle",
  resizeLabel: "Resize handle",
};

export default function WidgetContainerPermutations() {
  return (
    <>
      <header>
        <h1>Widget Container</h1>
        <main>
          <WidgetContainer i18nStrings={i18nStrings}></WidgetContainer>
        </main>
      </header>
    </>
  );
}

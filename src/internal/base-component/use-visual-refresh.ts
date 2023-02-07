// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ALWAYS_VISUAL_REFRESH } from "../environment";
import { IS_DEV } from "../is-development";
import { warnOnce } from "../logging";

export const useVisualRefresh = ALWAYS_VISUAL_REFRESH ? () => true : useVisualRefreshDynamic;

// We expect VR is to be set only once and before the application is rendered.
let visualRefreshState: undefined | boolean = undefined;

function detectVisualRefresh() {
  return typeof document !== "undefined" && !!document.querySelector(".awsui-visual-refresh");
}

function useVisualRefreshDynamic() {
  if (visualRefreshState === undefined) {
    visualRefreshState = detectVisualRefresh();
  }
  if (IS_DEV) {
    const newVisualRefreshState = detectVisualRefresh();
    if (newVisualRefreshState !== visualRefreshState) {
      warnOnce(
        "Visual Refresh",
        "Dynamic visual refresh change detected. This is not supported. " +
          "Make sure `awsui-visual-refresh` is attached to the `<body>` element before initial React render"
      );
    }
  }
  return visualRefreshState;
}

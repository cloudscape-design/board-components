// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DragAndDropData, useDragSubscription } from "../dnd-controller/controller";

import styles from "./styles.css.js";

function setup({ operation, interactionType }: DragAndDropData) {
  const isPointerInteraction = interactionType === "pointer";
  switch (operation) {
    case "insert":
    case "reorder":
      if (isPointerInteraction) {
        document.body.classList.add(styles["show-grab-cursor"]);
      }
      break;
    case "resize":
      if (isPointerInteraction) {
        document.body.classList.add(styles["show-resize-cursor"]);
      }
      break;
    default:
      throw new Error("Invariant violation: unexpected operation type.");
  }

  if (isPointerInteraction) {
    document.body.classList.add(styles["disable-selection"]);
  }
}

function teardown() {
  document.body.classList.remove(styles["show-grab-cursor"], styles["show-resize-cursor"], styles["disable-selection"]);
}

export function useGlobalDragStateStyles() {
  useDragSubscription("start", setup);
  useDragSubscription("discard", teardown);
  useDragSubscription("submit", teardown);
}

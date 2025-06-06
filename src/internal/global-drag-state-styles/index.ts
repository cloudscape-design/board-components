// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DragAndDropData, useDragSubscription } from "../dnd-controller/controller";

import styles from "./styles.css.js";

function assertNever(value: never) {
  throw new Error("Unexpected value: " + value);
}

function setup({ operation, interactionType }: DragAndDropData) {
  switch (operation) {
    case "insert":
    case "reorder":
      document.body.classList.add(styles["show-grab-cursor"]);
      break;
    case "resize":
      document.body.classList.add(styles["show-resize-cursor"]);
      break;
    default:
      // there will be a type error if not all operation types are handled
      assertNever(operation);
  }

  if (interactionType === "pointer") {
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

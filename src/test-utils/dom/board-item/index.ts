// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import componentsWrapper from "@cloudscape-design/components/test-utils/dom";
import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";
import itemStyles from "../../../board-item/styles.selectors.js";
import dragHandleStyles from "../../../internal/drag-handle/styles.selectors.js";
import resizeHandleStyles from "../../../internal/resize-handle/styles.selectors.js";

export default class BoardItemWrapper extends ComponentWrapper {
  static rootSelector: string = itemStyles.root;

  findDragHandle(): ComponentWrapper {
    return this.findByClassName(dragHandleStyles.handle)!;
  }

  findResizeHandle(): ComponentWrapper {
    return this.findByClassName(resizeHandleStyles.handle)!;
  }

  findSettings(): null | ComponentWrapper {
    return this.findByClassName(itemStyles.settings);
  }

  // @cloudscape-design/components/container methods

  findHeader(): null | ComponentWrapper {
    return this.findByClassName(itemStyles["header-content"]);
  }

  findContent(): ComponentWrapper {
    return componentsWrapper(this.getElement()).findContainer()!.findContent();
  }

  findFooter(): null | ComponentWrapper {
    return componentsWrapper(this.getElement()).findContainer()!.findFooter();
  }
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";

import PaletteItemWrapper from "../palette-item";

import paletteStyles from "../../../items-palette/styles.selectors.js";

export default class ItemsPaletteWrapper extends ComponentWrapper {
  static rootSelector: string = paletteStyles.root;

  findItems() {
    return this.findAllByClassName(PaletteItemWrapper.rootSelector).map(
      (wrapper) => new PaletteItemWrapper(wrapper.getElement()),
    );
  }

  findItemById(itemId: string): null | PaletteItemWrapper {
    return this.findComponent(`[data-item-id="${itemId}"]`, PaletteItemWrapper);
  }
}

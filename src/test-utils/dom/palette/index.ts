// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";
import paletteStyles from "../../../palette/styles.selectors.js";
import PaletteItemWrapper from "../palette-item";

export default class PaletteWrapper extends ComponentWrapper {
  static rootSelector: string = paletteStyles.root;

  findItemById(itemId: string): null | PaletteItemWrapper {
    return this.findComponent(`[data-item-id=${itemId}]`, PaletteItemWrapper);
  }
}

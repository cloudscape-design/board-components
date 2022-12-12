// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";
import paletteStyles from "../../../palette/styles.selectors.js";
import DashboardItemWrapper from "../dashboard-item";

export default class PaletteWrapper extends ComponentWrapper {
  static rootSelector: string = paletteStyles.root;

  findItemById(itemId: string): null | DashboardItemWrapper {
    return this.findComponent(`[data-item-id=${itemId}]`, DashboardItemWrapper);
  }
}

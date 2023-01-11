// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";
import dashboardStyles from "../../../layout/styles.selectors.js";
import BoardItemWrapper from "../board-item";

export default class DashboardWrapper extends ComponentWrapper {
  static rootSelector: string = dashboardStyles.root;

  findItemById(itemId: string): null | BoardItemWrapper {
    return this.findComponent(`[data-item-id=${itemId}]`, BoardItemWrapper);
  }
}

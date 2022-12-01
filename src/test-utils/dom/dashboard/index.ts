// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ComponentWrapper, ElementWrapper } from "@cloudscape-design/test-utils-core/dom";
import dashboardStyles from "../../../layout/styles.selectors.js";

export default class DashboardWrapper extends ComponentWrapper {
  static rootSelector: string = dashboardStyles.root;

  findItemById(itemId: string): null | ElementWrapper {
    return this.find(`[data-item-id=${itemId}]`);
  }
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";
import boardStyles from "../../../board/styles.selectors.js";
import BoardItemWrapper from "../board-item";

export default class BoardWrapper extends ComponentWrapper {
  static rootSelector: string = boardStyles.root;

  findItemById(itemId: string): null | BoardItemWrapper {
    return this.findComponent(`[data-item-id=${itemId}]`, BoardItemWrapper);
  }
}

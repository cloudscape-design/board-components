// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ComponentWrapper, createWrapper } from "@cloudscape-design/test-utils-core/dom";

import BoardItemWrapper from "../board-item";

import boardStyles from "../../../board/styles.selectors.js";

export default class BoardWrapper extends ComponentWrapper {
  static rootSelector: string = boardStyles.root;

  findItemById(itemId: string): null | BoardItemWrapper {
    return createWrapper().findComponent(`[data-item-id="${itemId}"]`, BoardItemWrapper);
  }
}

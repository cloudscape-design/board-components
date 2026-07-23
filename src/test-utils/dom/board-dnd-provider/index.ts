// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ComponentWrapper } from "@cloudscape-design/test-utils-core/dom";

import boardDndProviderStyles from "../../../board-dnd-provider/styles.selectors.js";

export default class BoardDndProviderWrapper extends ComponentWrapper {
  static rootSelector: string = boardDndProviderStyles.root;
}

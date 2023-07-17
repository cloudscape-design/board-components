// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Position } from "../utils/position";
import { LayoutEngineState } from "./engine-state";

export class LayoutEngineCacheNode {
  public position: null | Position = null;
  public state: LayoutEngineState;
  private next = new Array<LayoutEngineCacheNode>();

  constructor(state: LayoutEngineState) {
    this.state = state;
  }

  matches(position: Position, compute: () => LayoutEngineState): LayoutEngineCacheNode {
    for (const nextNode of this.next) {
      if (nextNode.position!.x === position.x && nextNode.position!.y === position.y) {
        return nextNode;
      }
    }

    const nextNode = new LayoutEngineCacheNode(compute());
    nextNode.position = position;
    this.next.push(nextNode);

    return nextNode;
  }
}

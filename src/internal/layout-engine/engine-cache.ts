// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Position } from "../utils/position";
import { LayoutEngineStepState } from "./engine-step";

export class LayoutEngineCacheNode {
  public position: null | Position = null;
  public state: LayoutEngineStepState;
  private next = new Array<LayoutEngineCacheNode>();

  constructor(state: LayoutEngineStepState) {
    this.state = state;
  }

  matches(position: Position, compute: () => LayoutEngineStepState): LayoutEngineCacheNode {
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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Position } from "../utils/position";
import { LayoutEngineState } from "./engine-state";

/**
 * The cache is used to avoid duplicate computations for the same initial state and path.
 * The cache must be invalidated once the items layout has changed e.g. as result of the operation commit.
 * The cache is a tree of nodes with the root node representing the initial state and empty path. The
 * rest of the tree store all previous state computations per path.
 */
export class LayoutEngineCacheNode {
  public position: null | Position = null;
  public state: LayoutEngineState;
  private next = new Array<LayoutEngineCacheNode>();

  constructor(state: LayoutEngineState) {
    this.state = state;
  }

  /**
   * The function takes path position and the callback to compute the corresponding state if not yet cached.
   * It returns the next cache node to take the next path position if available:
   *
   * const root = new LayoutEngineCacheNode(state)
   *
   * const x1y0 = root
   *    .matches({ x: 0, y: 0 }, () => compute({ x: 0, y: 0 })) // computes
   *    .matches({ x: 1, y: 0 }, () => compute({ x: 1, y: 0 })) // computes
   *    .state;
   *
   * const x2y0 = root
   *    .matches({ x: 0, y: 0 }, () => compute({ x: 0, y: 0 }))
   *    .matches({ x: 1, y: 0 }, () => compute({ x: 1, y: 0 }))
   *    .matches({ x: 2, y: 0 }, () => compute({ x: 2, y: 0 })) // computes
   *    .state;
   */
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

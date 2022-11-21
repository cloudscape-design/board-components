// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class StackSet<T> {
  private list: T[];
  private set: Set<T>;

  constructor(list: T[] = []) {
    this.list = list;
    this.set = new Set(list);
  }

  push(value: T): void {
    if (!this.set.has(value)) {
      this.list.push(value);
      this.set.add(value);
    }
  }

  pop(): null | T {
    const value = this.list.pop() ?? null;
    value && this.set.delete(value);
    return value;
  }
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class StackSet<T> {
  private list: T[];
  private set: Set<T>;

  constructor(input: StackSet<T> | T[] | void) {
    if (input instanceof StackSet) {
      this.list = [...input.list];
      this.set = new Set(this.list);
    } else {
      this.list = input ?? [];
      this.set = new Set(this.list);
    }
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

  clear(): void {
    this.list = [];
    this.set = new Set();
  }
}

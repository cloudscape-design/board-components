// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

class CustomEventStub<T> {
  defaultPrevented = false;
  cancelBubble = false;
  constructor(public detail: T | null = null) {}

  preventDefault() {
    // noop
  }

  stopPropagation() {
    // noop
  }
}

export function createCustomEvent<Detail>(detail: Detail): CustomEvent<Detail> {
  return new CustomEventStub(detail) as CustomEvent<Detail>;
}

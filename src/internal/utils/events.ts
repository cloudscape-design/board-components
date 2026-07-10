// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type { NonCancelableEventHandler } from "../../types/events";

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

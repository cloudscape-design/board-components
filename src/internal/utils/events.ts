// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
export function createCustomEvent<T>(detail: T): CustomEvent<T> {
  return { detail } as CustomEvent<T>;
}

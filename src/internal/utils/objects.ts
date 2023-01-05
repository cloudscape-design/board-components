// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function shallowEqual(o1: null | Record<string, any>, o2: null | Record<string, any>): boolean {
  if (!o1 && !o2) {
    return true;
  }
  if (!o1 || !o2) {
    return false;
  }

  const allKeys = [...new Set(Object.keys({ ...o1, ...o2 }))];
  for (const key of allKeys) {
    if (o1[key] !== o2[key]) {
      return false;
    }
  }

  return true;
}

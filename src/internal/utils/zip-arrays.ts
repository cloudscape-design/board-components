// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function zipTwoArrays<A, B>(a: readonly A[], b: readonly B[]): readonly [A, B][] {
  const longest = a.length >= b.length ? a : b;
  return longest.map((_, idx) => {
    return [a[idx], b[idx]];
  });
}

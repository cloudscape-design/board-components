// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";

export function forEachTimes<T>(times: number, array: T[], callback: (item: T) => void) {
  array.flatMap((item) => range(0, times).map(() => item)).forEach(callback);
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const messageCache: Record<string, true | undefined> = {};

export function warnOnce(component: string, message: string): void {
  const warning = `[${component}] ${message}`;
  if (!messageCache[warning]) {
    messageCache[warning] = true;
    console.warn(warning);
  }
}

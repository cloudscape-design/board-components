// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { startWebdriver, shutdownWebdriver } from "@cloudscape-design/browser-test-tools/chrome-launcher";

export const setup = () => startWebdriver();
export const teardown = () => shutdownWebdriver();

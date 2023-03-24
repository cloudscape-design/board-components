// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// type-only import, because in runtime it tries to access Jest globals, which do not exist
/// <reference types="@testing-library/jest-dom" />
import matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

expect.extend(matchers);

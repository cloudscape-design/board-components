// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { allureTest } from "../../vitest-reporter/fixture";
// import { screenshotTest } from "../utils";

allureTest("dummy", async ({ allure }) => {
  allure.attachment("test.txt", "{works: true}", "application/json");

  await allure.step("step 1", async () => {
    await allure.step("sub-step 1", async () => {});
    await allure.step("sub-step 2", () => {
      allure.attachment("sub-step.txt", "{subStep: true}", "application/json");
      return Promise.resolve();
    });
  });
});

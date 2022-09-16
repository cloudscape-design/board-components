// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import classnames from "./test-bed.module.css";

export const TestBed = ({ children }: { children: React.ReactNode }) => (
  <div className={classnames["test-bed"]}>{children}</div>
);

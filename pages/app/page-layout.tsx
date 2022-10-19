// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from "react";

import classnames from "./page-layout.module.css";

export interface PageLayoutProps {
  header?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageLayout({ children, header }: PageLayoutProps) {
  return (
    <div className={classnames.content}>
      <header>{header}</header>
      <main>{children}</main>
    </div>
  );
}

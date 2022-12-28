// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";

export interface ItemData {
  title: string;
  description: string;
  content: ReactNode;
  footer?: ReactNode;
  disableContentPaddings?: boolean;
}

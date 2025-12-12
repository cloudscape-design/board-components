// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Suspense } from "react";

import { pagesMap } from "../pages";
import useModes from "./use-modes";
export interface PageProps {
  pageId: string;
}
export default function Page({ pageId }: PageProps) {
  useModes();

  const Component = pagesMap[pageId];

  return (
    <Suspense fallback="Loading">
      <Component />
    </Suspense>
  );
}

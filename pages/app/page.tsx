// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { pagesMap } from "../pages";

export interface PageProps {
  pageId: string;
}

export default function Page({ pageId }: PageProps) {
  const [searchParams] = useSearchParams();
  const direction = searchParams.get("direction") ?? "ltr";

  useEffect(() => {
    document.documentElement.setAttribute("dir", direction);
  }, [direction]);

  const Component = pagesMap[pageId];

  return (
    <Suspense fallback="Loading">
      <Component />
    </Suspense>
  );
}

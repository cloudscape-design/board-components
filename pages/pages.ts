// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { lazy } from "react";

const pagesRaw = import.meta.glob("./**/*.page.tsx");
const pageIdRegex = /([\w-/]+)\.page\.tsx/;
const getPage = (path: string) => path.match(pageIdRegex)![1];

export const pages = Object.keys(pagesRaw).map(getPage);

type ComponentFactory = Parameters<typeof lazy>[0];

export const pagesMap = Object.fromEntries(
  Object.entries(pagesRaw).map(([path, dynamicImport]) => {
    const match = getPage(path);
    return [match, lazy(dynamicImport as ComponentFactory)];
  }),
);

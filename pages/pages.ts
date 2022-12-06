// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { lazy } from "react";

const pagesRaw = import.meta.glob("./**/*.page.tsx");
const testPagesRaw = import.meta.glob("./**/*.test-page.tsx");
const allPagesRaw = { ...pagesRaw, ...testPagesRaw };

const pageIdRegex = /([\w-/]+)\.(test-)?page\.tsx/;
const getPage = (path: string) => path.match(pageIdRegex)![1];
const getRoute = (page: string) => `/#${page}`;

export const pages = Object.keys(allPagesRaw).map(getPage);
export const routes = pages.map(getRoute);

type ComponentFactory = Parameters<typeof lazy>[0];

export const pagesMap = Object.fromEntries(
  Object.entries(allPagesRaw).map(([path, dynamicImport]) => {
    const match = getPage(path);
    return [match, lazy(dynamicImport as ComponentFactory)];
  })
);

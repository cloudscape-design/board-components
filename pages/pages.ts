// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React from "react";

const pagesRaw = import.meta.glob("./*.pages.tsx");
const pageIdRegex = /.*\/([\w,-]+)\.pages\.tsx/;
const getPage = (path: string) => path.match(pageIdRegex)?.[1];

export const pages = Object.keys(pagesRaw).map(getPage);

type ComponentFactory = Parameters<typeof React.lazy>[0];

export const pagesMap = Object.fromEntries(
  Object.entries(pagesRaw).map(([path, dynamicImport]) => {
    const match = getPage(path);
    return [match, React.lazy(dynamicImport as ComponentFactory)];
  })
);

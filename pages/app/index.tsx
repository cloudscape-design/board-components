// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom";

import { AppModesProvider, type AppUrlParams } from "@cloudscape-design/build-tools/lib/dev-pages-utils";
import {
  applyDensity,
  applyMode,
  applyTheme,
  Density,
  disableMotion,
  Mode,
  Theme,
} from "@cloudscape-design/global-styles";

import { pages } from "../pages";
import Page from "./page";

function applyModes(params: AppUrlParams, target?: Element) {
  applyMode(params.mode as Mode, target);
  applyDensity(params.density as Density, target);
  disableMotion(params.motionDisabled, target);
  applyTheme((params.theme as Theme) ?? null, target);
}

export default function App() {
  return (
    <HashRouter>
      <AppModesProvider applyModes={applyModes}>
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/*" element={<PageWithFallback />} />
        </Routes>
      </AppModesProvider>
    </HashRouter>
  );
}

const Start = () => (
  <>
    <h1>Pages</h1>
    <main>
      <Index />
    </main>
  </>
);

const Index = () => (
  <ul className="list">
    {pages.map((page) => (
      <li key={page}>
        <Link to={`${page}`}>{page}</Link>
      </li>
    ))}
  </ul>
);

const PageWithFallback = () => {
  const { pathname: page } = useLocation();

  if (!page || !page.includes(page)) {
    return <span>Not Found</span>;
  }

  return <Page pageId={page} />;
};

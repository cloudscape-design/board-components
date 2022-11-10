// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { HashRouter, Link, Route, Routes, useLocation } from "react-router-dom";
import { pages } from "../pages";
import Page from "./page";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/*" element={<PageWithFallback />} />
      </Routes>
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

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { HashRouter, Link, Route, Routes, useParams } from "react-router-dom";
import Page from "./page";
import { pages } from "../pages";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/:folder/:page" element={<PageWithFallback />} />
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
  const { folder, page } = useParams();
  const pageId = `/${folder}/${page}`;

  if (!pageId || !pages.includes(pageId)) {
    return <span>Not Found</span>;
  }

  return <Page pageId={pageId} />;
};

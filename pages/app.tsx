// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { HashRouter, Link, Route, Routes, useParams } from "react-router-dom";
import Page from "./page";
import { pages } from "./pages";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/:pageId" element={<PageWrapper />} />
      </Routes>
    </HashRouter>
  );
}

const Index = () => (
  <ul>
    {pages.map((page) => (
      <Link to={`/${page}`}>{page}</Link>
    ))}
  </ul>
);

const PageWrapper = () => {
  const { pageId } = useParams();

  if (!pageId || !pages.includes(pageId)) {
    return <span>Not Found</span>;
  }
  return <Page pageId={pageId} />;
};

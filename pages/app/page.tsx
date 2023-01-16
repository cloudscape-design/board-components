// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Suspense, useEffect } from "react";
import { pagesMap } from "../pages";

interface ExtendedWindow extends Window {
  __liveAnnouncements?: string[];
}
declare const window: ExtendedWindow;

export interface PageProps {
  pageId: string;
}

export default function Page({ pageId }: PageProps) {
  const Component = pagesMap[pageId];

  // Collect page's live announcements to window.__liveAnnouncements.
  useEffect(() => {
    const observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        if (
          mutation.type === "childList" &&
          mutation.target instanceof HTMLElement &&
          mutation.target.hasAttribute("aria-live") &&
          mutation.target.textContent
        ) {
          if (!window.__liveAnnouncements) {
            window.__liveAnnouncements = [];
          }
          window.__liveAnnouncements.push(mutation.target.textContent);
        }
      }
    });

    observer.observe(document.body, { attributes: false, childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <Suspense fallback="Loading">
      <Component />
    </Suspense>
  );
}

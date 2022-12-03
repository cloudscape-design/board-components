// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { ReactNode } from "react";
import { useMergeRefs } from "../../lib/components/internal/utils/use-merge-refs";
import classnames from "./engine.module.css";

export function DefaultContainer({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function ResponsiveContainer({ children }: { children: ReactNode }) {
  return (
    <div className={classnames["demo-item-content"]} style={{ height: "100%", width: "100%" }}>
      {children}
    </div>
  );
}

export function FixedContainer({ children, height, width }: { children: ReactNode; height: number; width: number }) {
  return (
    <div className={classnames["demo-item-content"]} style={{ height, width }}>
      {children}
    </div>
  );
}

export function ScrollableContainer({
  children,
  height,
  width,
}: {
  children: ReactNode;
  height?: number;
  width?: number;
}) {
  return (
    <div className={classnames["demo-item-content"]} style={{ height: "100%", width: "100%", overflow: "auto" }}>
      <div style={{ height: "100%", width: "100%", minHeight: height, minWidth: width }}>{children}</div>
    </div>
  );
}

export function QueryContainer({
  children,
  minWidth = 0,
  minHeight = 0,
}: {
  children: (size: { width?: number; height?: number }) => ReactNode;
  minWidth?: number;
  minHeight?: number;
}) {
  const [height, containerQueryHeightRef] = useContainerQuery((entry) => entry.contentBoxHeight);
  const [width, containerQueryWidthRef] = useContainerQuery((entry) => entry.contentBoxWidth);
  const containerQueryRef = useMergeRefs(containerQueryHeightRef, containerQueryWidthRef);

  const normalizedWidth = Math.max(width ?? 0, minWidth);
  const normalizedHeight = Math.max(height ?? 0, minHeight);

  const useScroll = (width ?? 0) < minWidth || (height ?? 0) < minHeight;
  const content = children({ width: normalizedWidth, height: normalizedHeight });

  return (
    <div ref={containerQueryRef} style={{ height: "100%", width: "100%" }}>
      {useScroll ? (
        <ScrollableContainer width={minWidth} height={minHeight}>
          {content}
        </ScrollableContainer>
      ) : (
        content
      )}
    </div>
  );
}

export function TwoColContainer({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, height: "100%" }}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
}

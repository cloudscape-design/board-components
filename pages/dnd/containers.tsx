// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";

import { useContainerQuery } from "@cloudscape-design/component-toolkit";

import classnames from "./engine.module.css";

export function DefaultContainer({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function ResponsiveContainer({ children }: { children: ReactNode }) {
  return (
    <div className={classnames["demo-item-with-border"]} style={{ height: "100%", width: "100%" }}>
      {children}
    </div>
  );
}

export function FixedContainer({ children, height, width }: { children: ReactNode; height: number; width: number }) {
  return (
    <div className={classnames["demo-item-with-border"]} style={{ height, width }}>
      {children}
    </div>
  );
}

export function ScrollableContainer({
  children,
  height,
  width,
  showBorder = true,
}: {
  children: ReactNode;
  height?: number;
  width?: number;
  showBorder?: boolean;
}) {
  return (
    <div
      className={showBorder ? classnames["demo-item-with-border"] : undefined}
      style={{ height: "100%", width: "100%", overflow: "auto" }}
    >
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
  const [size, containerQueryRef] = useContainerQuery((entry) => ({
    height: entry.contentBoxHeight,
    width: entry.contentBoxWidth,
  }));

  const normalizedWidth = Math.max(size?.width ?? 0, minWidth);
  const normalizedHeight = Math.max(size?.height ?? 0, minHeight);

  const useScroll = (size?.width ?? 0) < minWidth || (size?.height ?? 0) < minHeight;
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

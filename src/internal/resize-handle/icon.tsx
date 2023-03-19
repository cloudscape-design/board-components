// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Icon from "@cloudscape-design/components/icon";
import { memo } from "react";

export function ResizeHandleIcon() {
  return <Icon svg={<SVG />} />;
}

function SVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.5 14.5L14.5 9.5" strokeWidth="2" />
      <path d="M4 14.5L14.5 4" strokeWidth="2" />
    </svg>
  );
}

export default memo(ResizeHandleIcon);

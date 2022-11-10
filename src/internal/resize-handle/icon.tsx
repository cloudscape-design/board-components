// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Icon from "@cloudscape-design/components/icon";
import { memo } from "react";

export function ResizeHandleIcon() {
  return <Icon svg={<SVG />} />;
}

function SVG() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
      <line x1="9.94" y1="14.95" x2="14.98" y2="9.57" />
      <line x1="5.75" y1="14.95" x2="14.98" y2="5.35" />
      <line x1="0.98" y1="14.95" x2="14.98" y2="0.95" />
    </svg>
  );
}

export default memo(ResizeHandleIcon);

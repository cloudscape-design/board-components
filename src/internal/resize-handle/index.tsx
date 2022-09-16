// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { ForwardedRef } from "react";

import Handle from "../handle";
import { ResizeHandleIcon } from "./icon";

export type ResizeHandleProps = Record<string, never>;

function ResizeHandle(props: ResizeHandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <Handle ref={ref}>
      <ResizeHandleIcon />
    </Handle>
  );
}

export default React.forwardRef(ResizeHandle);

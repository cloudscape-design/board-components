// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import React, { ForwardedRef } from "react";

import Handle from "../handle";
import DragHandleIcon from "./icon";

export type DragHandleProps = Record<string, never>;

function DragHandle(props: DragHandleProps, ref: ForwardedRef<HTMLButtonElement>) {
  return (
    <Handle ref={ref}>
      <DragHandleIcon />
    </Handle>
  );
}

export default React.forwardRef(DragHandle);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBaseComponent from "../internal/base-component/use-base-component";
import type { BoardProps } from "./interfaces";
import { InternalBoard } from "./internal";

export type { BoardProps };

export default function Board<DataType>(props: BoardProps<DataType>) {
  const baseComponentProps = useBaseComponent("Board");
  return <InternalBoard {...props} {...baseComponentProps} />;
}

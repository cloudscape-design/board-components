// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { BoardProps } from "./interfaces";
import { InternalBoard } from "./internal";

export type { BoardProps };

export default function Board<DataType>(props: BoardProps<DataType>) {
  return <InternalBoard {...props} />;
}

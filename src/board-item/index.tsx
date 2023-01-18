// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { BoardItemProps } from "./interfaces";
import { InternalBoardItem } from "./internal";

export { BoardItemProps };

export default function BoardItem(props: BoardItemProps) {
  return <InternalBoardItem {...props} />;
}

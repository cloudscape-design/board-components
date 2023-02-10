// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBaseComponent from "../internal/base-component/use-base-component";
import { applyDisplayName } from "../internal/utils/apply-display-name";
import type { BoardItemProps } from "./interfaces";
import { InternalBoardItem } from "./internal";

export { BoardItemProps };

export default function BoardItem(props: BoardItemProps) {
  const baseComponentProps = useBaseComponent("BoardItem");
  return <InternalBoardItem {...props} {...baseComponentProps} />;
}

applyDisplayName(BoardItem, "BoardItem");

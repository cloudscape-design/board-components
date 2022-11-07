// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Transform, useCombinedRefs, CSS as CSSUtil } from "@dnd-kit/utilities";
import { CSSProperties } from "react";
import { ItemContext } from "./interfaces";

interface SortableItemProps {
  id: string;
  renderItem: (context: ItemContext) => JSX.Element;
  transform: Transform | null;
  animate: boolean;
}

export function SortableItem({ id, renderItem, transform }: SortableItemProps) {
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
    transform: dragTransform,
    active,
  } = useDraggable({ id });
  const { setNodeRef: setDropRef } = useDroppable({ id });

  const style: CSSProperties = {
    transform: CSSUtil.Translate.toString(dragTransform ?? transform),
    transition:
      !dragTransform && active
        ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
        : undefined,
  };

  return renderItem({
    isDragging,
    ref: useCombinedRefs(setDragRef, setDropRef),
    props: { ...attributes, ...listeners, style },
  });
}

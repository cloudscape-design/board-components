// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useId } from "react";
import clsx from "clsx";

import Container from "@cloudscape-design/components/container";
import { DragHandleProps } from "@cloudscape-design/components/internal/components/drag-handle";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import DragHandle from "../internal/drag-handle";
import { useItemContext } from "../internal/item-container";
import ResizeHandle from "../internal/resize-handle";
import ScreenreaderOnly from "../internal/screenreader-only";
import WidgetContainerHeader from "./header";
import type { BoardItemProps } from "./interfaces";

import styles from "./styles.css.js";

const mapHandleDirectionToKeyboardDirection = (direction: DragHandleProps.Direction) => {
  const directionMap = {
    "inline-start": "left",
    "inline-end": "right",
    "block-start": "up",
    "block-end": "down",
  };
  return directionMap[direction];
};

export function InternalBoardItem({
  children,
  header,
  settings,
  disableContentPaddings,
  footer,
  i18nStrings,
  __internalRootRef,
  ...rest
}: BoardItemProps & InternalBaseComponentProps) {
  const { dragHandle, resizeHandle, isActive } = useItemContext();

  const dragHandleAriaLabelledBy = useId();
  const dragHandleAriaDescribedBy = useId();

  const resizeHandleAriaLabelledBy = useId();
  const resizeHandleAriaDescribedBy = useId();

  return (
    <div ref={__internalRootRef} className={styles.root} {...getDataAttributes(rest)}>
      <Container
        fitHeight={true}
        disableHeaderPaddings={true}
        header={
          <WidgetContainerHeader
            handle={
              <>
                {/*<InternalDragHandle*/}
                {/*  ref={dragHandle.ref}*/}
                {/*  showButtons={dragHandle.showButtons}*/}
                {/*  ariaLabelledBy={dragHandleAriaLabelledBy}*/}
                {/*  ariaDescribedby={dragHandleAriaDescribedBy}*/}
                {/*  variant="drag-indicator"*/}
                {/*  // Provide an arbitrary large value to valueMax since the editor can be*/}
                {/*  // resized to be infinitely large.*/}
                {/*  ariaValue={{ valueMin: 0, valueMax: 1000000, valueNow: 100 }}*/}
                {/*  tooltipText={"Tooltip Text"}*/}
                {/*  onKeyDown={(event) => {*/}
                {/*    console.log("onKeyDown triggered", event.key);*/}
                {/*    dragHandle.onKeyDown(event);*/}
                {/*  }}*/}
                {/*  onPointerDown={dragHandle.onPointerDown}*/}
                {/*  directions={{*/}
                {/*    "block-start": "active",*/}
                {/*    "block-end": "active",*/}
                {/*    "inline-start": "active",*/}
                {/*    "inline-end": "active",*/}
                {/*  }}*/}
                {/*  interactionMode="controlled"*/}
                {/*  onDirectionClick={(direction) => {*/}
                {/*    const directionMap = {*/}
                {/*      "inline-start": "left",*/}
                {/*      "inline-end": "right",*/}
                {/*      "block-start": "up",*/}
                {/*      "block-end": "down",*/}
                {/*    };*/}
                {/*    dragHandle.onDirectionClick(directionMap[direction]);*/}
                {/*  }}*/}
                {/*/>*/}
                <DragHandle
                  ref={dragHandle.ref}
                  ariaLabelledBy={dragHandleAriaLabelledBy}
                  ariaDescribedBy={dragHandleAriaDescribedBy}
                  onPointerDown={dragHandle.onPointerDown}
                  onKeyDown={(event) => {
                    console.log("onKeyDown triggered", event.key);
                    dragHandle.onKeyDown(event);
                  }}
                  isActivePointer={dragHandle.isActivePointer}
                  isActiveUap={dragHandle.isActiveUap}
                  showButtons={dragHandle.showButtons}
                  onDirectionClick={(direction) => {
                    dragHandle.onDirectionClick(mapHandleDirectionToKeyboardDirection(direction));
                  }}
                />

                {/*ShowButtons: {dragHandle.showButtons?.toString()}*/}
              </>
            }
            settings={settings}
          >
            {header}
          </WidgetContainerHeader>
        }
        footer={footer}
        disableContentPaddings={disableContentPaddings}
        className={clsx(styles["container-override"], isActive && styles.active)}
      >
        {children}
      </Container>
      {resizeHandle && (
        <div className={styles.resizer}>
          {/*<InternalDragHandle*/}
          {/*  showButtons={dragHandle.showButtons}*/}
          {/*  ariaLabelledBy={resizeHandleAriaLabelledBy}*/}
          {/*  ariaDescribedby={resizeHandleAriaDescribedBy}*/}
          {/*  variant="resize-area"*/}
          {/*  // Provide an arbitrary large value to valueMax since the editor can be*/}
          {/*  // resized to be infinitely large.*/}
          {/*  ariaValue={{ valueMin: 0, valueMax: 1000000, valueNow: 100 }}*/}
          {/*  tooltipText={"Tooltip Text"}*/}
          {/*  onKeyDown={(event) => {*/}
          {/*    console.log("onKeyDown triggered", event.key);*/}
          {/*    resizeHandle.onKeyDown(event);*/}
          {/*  }}*/}
          {/*  onPointerDown={resizeHandle.onPointerDown}*/}
          {/*  directions={{*/}
          {/*    "block-start": "active",*/}
          {/*    "block-end": "active",*/}
          {/*    "inline-start": "active",*/}
          {/*    "inline-end": "active",*/}
          {/*  }}*/}
          {/*  interactionMode="controlled"*/}
          {/*  onDirectionClick={(direction) => {*/}
          {/*    const directionMap = {*/}
          {/*      "inline-start": "left",*/}
          {/*      "inline-end": "right",*/}
          {/*      "block-start": "up",*/}
          {/*      "block-end": "down",*/}
          {/*    };*/}
          {/*    resizeHandle.onDirectionClick(directionMap[direction]);*/}
          {/*  }}*/}
          {/*/>*/}
          <ResizeHandle
            ariaLabelledBy={resizeHandleAriaLabelledBy}
            ariaDescribedBy={resizeHandleAriaDescribedBy}
            onPointerDown={resizeHandle.onPointerDown}
            onKeyDown={resizeHandle.onKeyDown}
            isActivePointer={resizeHandle.isActivePointer}
            isActiveUap={resizeHandle.isActiveUap}
            onDirectionClick={(direction) => {
              resizeHandle.onDirectionClick(mapHandleDirectionToKeyboardDirection(direction));
            }}
          />
        </div>
      )}

      <ScreenreaderOnly id={dragHandleAriaLabelledBy}>{i18nStrings.dragHandleAriaLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={dragHandleAriaDescribedBy}>{i18nStrings.dragHandleAriaDescription}</ScreenreaderOnly>

      <ScreenreaderOnly id={resizeHandleAriaLabelledBy}>{i18nStrings.resizeHandleAriaLabel}</ScreenreaderOnly>
      <ScreenreaderOnly id={resizeHandleAriaDescribedBy}>{i18nStrings.resizeHandleAriaDescription}</ScreenreaderOnly>
    </div>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import clsx from "clsx";
import DragHandle from "../internal/drag-handle";
import { useItemContext } from "../internal/item-container";
import ResizeHandle from "../internal/resize-handle";
import WidgetContainerHeader from "./header";
import type { DashboardItemProps } from "./interfaces";
import styles from "./styles.css.js";

export type { DashboardItemProps };

export default function DashboardItem({
  children,
  header,
  settings,
  i18nStrings,
  disableContentPaddings,
  footer,
}: DashboardItemProps) {
  const { contentWidth, contentHeight, dragHandle, resizeHandle } = useItemContext();

  return (
    <div className={styles.root}>
      <Container disableContentPaddings={true}>
        <div className={styles.body} style={{ maxWidth: contentWidth, maxHeight: contentHeight }}>
          <WidgetContainerHeader
            handle={
              <DragHandle
                ariaLabel={i18nStrings.dragHandleLabel}
                onPointerDown={dragHandle.onPointerDown}
                onKeyDown={dragHandle.onKeyDown}
              />
            }
            settings={settings}
          >
            {header}
          </WidgetContainerHeader>

          <div
            className={clsx(styles["content-wrapper"], {
              [styles["content-wrapper-disable-paddings"]]: disableContentPaddings,
            })}
          >
            <div className={styles.content}>{children}</div>
          </div>

          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </Container>
      {resizeHandle && (
        <div className={styles.resizer}>
          <ResizeHandle
            ariaLabel={i18nStrings.resizeLabel}
            onPointerDown={resizeHandle.onPointerDown}
            onKeyDown={resizeHandle.onKeyDown}
          />
        </div>
      )}
    </div>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import DragHandle from "../internal/drag-handle/index";
import type { WidgetContainerProps } from "./interfaces";
import WidgetContainerHeader from "./header";
import ResizeHandle from "../internal/resize-handle";
import styles from "./styles.css.js";

export type { WidgetContainerProps };

export default function WidgetContainer(props: WidgetContainerProps) {
  const { children, header, settings, i18nStrings, ...containerProps } = props;
  const headerComponent = (
    <WidgetContainerHeader handle={<DragHandle ariaLabel={i18nStrings.dragHandleLabel} />} settings={settings}>
      {header}
    </WidgetContainerHeader>
  );
  return (
    <div className={styles.wrapper}>
      <Container {...containerProps} disableHeaderPaddings={true} header={headerComponent}>
        {children}
      </Container>
      <div className={styles.resizer}>
        <ResizeHandle ariaLabel={i18nStrings.resizeLabel} />
      </div>
    </div>
  );
}

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import DragHandle from "../internal/drag-handle/index";
import type { WidgetContainerProps } from "./interfaces";
import styles from "./styles.css.js";

export type { WidgetContainerProps };

export default function WidgetContainer(props: WidgetContainerProps) {
  const { children, ...containerProps } = props;
  const header = (
    <div className={styles.header}>
      <div className={styles.handle}>
        <DragHandle />
      </div>
      {props.header}
    </div>
  );
  return (
    <Container {...containerProps} disableHeaderPaddings={true} header={header}>
      {children}
    </Container>
  );
}

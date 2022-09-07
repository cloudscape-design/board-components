// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Container from "@cloudscape-design/components/container";
import { ReactNode } from "react";
import styles from "./styles.css.js";

interface WidgetContainerProps {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
  disableContentPaddings: boolean;
  i18nStrings: {
    dragHandleLabel: string;
    resizeLabel: string;
  };
}

export default function WidgetContainer({ children, header, footer, disableContentPaddings }: WidgetContainerProps) {
  return (
    <Container header={header} footer={footer} disableContentPaddings={disableContentPaddings}>
      <div className={styles.content}>{children}</div>
    </Container>
  );
}

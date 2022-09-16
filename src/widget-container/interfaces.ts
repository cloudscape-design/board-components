// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ContainerProps } from "@cloudscape-design/components/container";

export interface WidgetContainerProps
  extends Pick<ContainerProps, "children" | "header" | "footer" | "disableContentPaddings"> {
  i18nStrings: {
    dragHandleLabel: string;
    resizeLabel: string;
  };
}

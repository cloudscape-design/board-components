// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { ContainerProps } from "@cloudscape-design/components/container";
import React from "react";

export interface WidgetContainerProps
  extends Pick<ContainerProps, "children" | "header" | "footer" | "disableContentPaddings"> {
  /**
   * A secondary actions area that is pulled right and stays in a fixed location on all screen sizes. Allows for an overflow actions menu in the form of a button dropdown.
   */
  settings?: React.ReactNode;
  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings: {
    dragHandleLabel: string;
    resizeLabel: string;
  };
}

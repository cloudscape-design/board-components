// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";

export interface BoardItemProps {
  /**
   * Heading element of the item. Use the [header component](/components/header/).
   */
  header?: ReactNode;

  /**
   * Main content of the item.
   */
  children?: ReactNode;

  /**
   * Determines whether the main content of the item has padding. If `true`, removes the default padding
   * from the content area.
   */
  disableContentPaddings?: boolean;

  /**
   * Footer of the item.
   */
  footer?: ReactNode;

  /**
   * Additional slot next to the heading. Use it to render an overflow actions menu in the form of a button dropdown.
   */
  settings?: ReactNode;

  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings: BoardItemProps.I18nStrings;
}

export namespace BoardItemProps {
  export interface I18nStrings {
    dragHandleAriaLabel: string;
    dragHandleAriaDescription?: string;
    resizeHandleAriaLabel: string;
    resizeHandleAriaDescription?: string;
  }
}

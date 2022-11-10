// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataFallbackType, ItemBase } from "../internal/base-types";

export interface DashboardPaletteProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the palette. The content of each item is controlled by the `renderItem` property.
   */
  items: readonly PaletteProps.Item<D>[];

  /**
   * Specifies a function to render a palette item content. The return value must include dashboard item component.
   */
  renderItem(item: PaletteProps.Item<D>): JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings: PaletteProps.I18nStrings;
}

export namespace PaletteProps {
  export type Item<D = DataFallbackType> = ItemBase<D>;

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface I18nStrings {}
}

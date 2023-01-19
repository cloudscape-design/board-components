// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useId, useMemo, useState } from "react";
import { GridLayout, ItemId } from "../interfaces";
import ScreenreaderOnly from "../screenreader-only";

import styles from "./styles.css.js";

export interface ScreenReaderGridNavigationProps<Item> {
  items: readonly Item[];
  itemsLayout: GridLayout;
  ariaLabel: string;
  ariaDescription?: string;
  itemAriaLabel: (item: null | Item) => string;
  onActivateItem: (itemId: ItemId) => void;
}

/**
 * The component provides a native screen-reader grid navigation for board items.
 * A separate navigation component is used because the navigation requires a table or table-like
 * DOM structure while the board uses CSS grid.
 *
 * The screen-reader navigation component is hidden and don't have a tab stop, however, it can be focused
 * programmatically or with a screen-reader. When focused with a screen-reader the component becomes visible
 * so that it can be clicked (e.g. the VO can imitate clicks on the elements under VO cursor with VO+Space).
 */
export function ScreenReaderGridNavigation<Item extends { id: string }>({
  items,
  itemsLayout,
  ariaLabel,
  ariaDescription,
  itemAriaLabel,
  onActivateItem,
}: ScreenReaderGridNavigationProps<Item>) {
  const [isNavigationFocused, setIsNavigationFocused] = useState(false);
  const className = isNavigationFocused
    ? styles["screen-reader-navigation-visible"]
    : styles["screen-reader-navigation-hidden"];

  const tableId = useId();
  const navigationDescriptionId = useId();

  const getItem = useMemo(() => {
    const itemById = new Map(items.map((it) => [it.id, it]));
    return (id: null | ItemId) => (id ? itemById.get(id) ?? null : null);
  }, [items]);

  const layout: (null | ItemId)[][] = [];

  function makeNewRow() {
    layout.push([...Array(itemsLayout.columns)].map(() => null));
  }

  for (const item of itemsLayout.items) {
    for (let y = item.y; y < item.y + item.height; y++) {
      while (layout.length <= y) {
        makeNewRow();
      }
      for (let x = item.x; x < item.x + item.width; x++) {
        layout[y][x] = item.id;
      }
    }
  }

  return (
    <div
      role="navigation"
      aria-labelledby={tableId}
      aria-describedby={ariaDescription ? navigationDescriptionId : undefined}
      className={className}
    >
      <table
        id={tableId}
        role="grid"
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? navigationDescriptionId : undefined}
      >
        <tbody>
          {layout.map((row, rowIndex) => (
            <tr role="row" key={rowIndex}>
              {row.map((itemId, cellIndex) => (
                <td role="gridcell" key={cellIndex}>
                  {itemId ? (
                    <button
                      tabIndex={-1}
                      onClick={() => itemId && onActivateItem(itemId)}
                      onFocus={() => setIsNavigationFocused(true)}
                      onBlur={() => setIsNavigationFocused(false)}
                    >
                      {itemAriaLabel(getItem(itemId))}
                    </button>
                  ) : (
                    itemAriaLabel(getItem(itemId))
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {ariaDescription && <ScreenreaderOnly id={navigationDescriptionId}>{ariaDescription}</ScreenreaderOnly>}
    </div>
  );
}

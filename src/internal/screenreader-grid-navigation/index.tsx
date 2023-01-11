// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useId, useMemo, useState } from "react";
import { GridLayout, ItemId } from "../interfaces";
import ScreenreaderOnly from "../screenreader-only";

import styles from "./styles.css.js";

export function ScreenReaderGridNavigation<Item extends { id: string }>({
  items,
  itemsLayout,
  ariaLabel,
  ariaDescription,
  itemAriaLabel,
  onFocusItem,
}: {
  items: readonly Item[];
  itemsLayout: GridLayout;
  ariaLabel: string;
  ariaDescription?: string;
  itemAriaLabel: (item: null | Item) => string;
  onFocusItem: (itemId: ItemId) => void;
}) {
  const [isNavigationFocused, setIsNavigationFocused] = useState(false);
  const className = isNavigationFocused
    ? styles["screen-reader-navigation-visible"]
    : styles["screen-reader-navigation-hidden"];

  const ariaDescribedBy = useId();

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
    <>
      <table
        role="grid"
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? ariaDescribedBy : undefined}
        className={className}
      >
        <tbody>
          {layout.map((row, rowIndex) => (
            <tr role="row" key={rowIndex}>
              {row.map((itemId, cellIndex) => (
                <td
                  role="gridcell"
                  key={cellIndex}
                  tabIndex={-1}
                  onClick={() => itemId && onFocusItem(itemId)}
                  onFocus={() => setIsNavigationFocused(true)}
                  onBlur={() => setIsNavigationFocused(false)}
                >
                  {itemAriaLabel(getItem(itemId))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {ariaDescription && <ScreenreaderOnly id={ariaDescribedBy}>{ariaDescription}</ScreenreaderOnly>}
    </>
  );
}

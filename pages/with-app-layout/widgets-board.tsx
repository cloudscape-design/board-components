// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Header } from "@cloudscape-design/components";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import { useState } from "react";
import { Board, BoardItem, BoardProps } from "../../lib/components";
import { boardI18nStrings, boardItemI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { clientI18nStrings } from "./i18n";

interface WidgetsBoardProps {
  widgets: readonly BoardProps.Item<ItemData>[];
  onWidgetsChange: (detail: BoardProps.ItemsChangeDetail<ItemData>) => void;
}

export function WidgetsBoard({ widgets, onWidgetsChange }: WidgetsBoardProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<null | string>(null);
  return (
    <Board
      i18nStrings={boardI18nStrings}
      empty={clientI18nStrings.widgetsBoard.widgetsEmpty}
      items={widgets}
      onItemsChange={({ detail }) => onWidgetsChange(detail)}
      renderItem={(item, actions) => (
        <>
          <BoardItem
            header={<Header>{item.data.title}</Header>}
            footer={item.data.footer}
            settings={
              <ButtonDropdown
                items={[{ id: "remove", text: clientI18nStrings.widgetsBoard.removeWidgetAction }]}
                ariaLabel={clientI18nStrings.widgetsBoard.widgetSettings}
                variant="icon"
                onItemClick={() => setDeleteConfirmation(item.id)}
              />
            }
            i18nStrings={boardItemI18nStrings}
          >
            {item.data.content}
          </BoardItem>

          <DeleteConfirmationModal
            title={item.data.title}
            visible={deleteConfirmation === item.id}
            onDismiss={() => setDeleteConfirmation(null)}
            onConfirm={() => {
              actions.removeItem();
              setDeleteConfirmation(null);
            }}
          />
        </>
      )}
    />
  );
}

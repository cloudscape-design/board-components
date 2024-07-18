// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";
import Form from "@cloudscape-design/components/form";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { clientI18nStrings } from "../shared/i18n";

export function DeleteConfirmationModal({
  title,
  visible,
  onDismiss,
  onConfirm,
}: {
  title: string;
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} onDismiss={onDismiss} header={clientI18nStrings.deleteConfirmation.header}>
      <Form
        actions={
          <SpaceBetween size="s" direction="horizontal">
            <Button variant="normal" onClick={onDismiss}>
              {clientI18nStrings.deleteConfirmation.discard}
            </Button>
            <Button variant="primary" onClick={onConfirm}>
              {clientI18nStrings.deleteConfirmation.confirm}
            </Button>
          </SpaceBetween>
        }
      >
        {clientI18nStrings.deleteConfirmation.message(title)}
      </Form>
    </Modal>
  );
}

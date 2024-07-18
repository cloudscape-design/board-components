// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import Button from "@cloudscape-design/components/button";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Textarea from "@cloudscape-design/components/textarea";

import PageLayout from "../app/page-layout";
import { EnginePageTemplate } from "./engine-page-template";
import { createLetterItems, letterWidgets } from "./items";

const exampleBoard = `[
  ["A", "A", "B", "C"],
  ["A", "A", "B", "C"]
]`;
const examplePalette = `["X"]`;

export default function QueryTestPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const boardQuery = parseJson(searchParams.get("board") ?? "");
  const paletteQuery = parseJson(searchParams.get("palette") ?? "");
  const isEmpty = !boardQuery.text && !paletteQuery.text;

  const [board, setBoard] = useState(isEmpty ? parseJson(exampleBoard) : boardQuery);
  const [palette, setPalette] = useState(isEmpty ? parseJson(examplePalette) : paletteQuery);

  const layout = createLetterItems(boardQuery.value ?? [], paletteQuery.value ?? []);

  if (layout && layout.boardItems.length + layout.paletteItems.length === 0) {
    return (
      <PageLayout>
        <form
          style={{ maxWidth: 800 }}
          onSubmit={(e) => {
            e.preventDefault();
            setSearchParams({ board: board.text.replace(/\s/g, ""), palette: palette.text.replace(/\s/g, "") });
          }}
        >
          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary">Set query parameters</Button>
              </SpaceBetween>
            }
            header={
              <Header
                variant="h1"
                description="This page requires query parameters to work. Use letters from A to Z to represent board items (see examples below)."
              >
                Query test page
              </Header>
            }
          >
            <SpaceBetween direction="vertical" size="l">
              <FormField label="layout" errorText={board.error}>
                <Textarea value={board.text} onChange={(e) => setBoard(parseJson(e.detail.value))} rows={4} />
              </FormField>
              <FormField label="palette" errorText={palette.error}>
                <Textarea value={palette.text} onChange={(e) => setPalette(parseJson(e.detail.value))} rows={1} />
              </FormField>
            </SpaceBetween>
          </Form>
        </form>
      </PageLayout>
    );
  }

  return (
    <EnginePageTemplate
      initialBoardItems={layout?.boardItems ?? []}
      initialPaletteItems={layout?.paletteItems ?? []}
      widgets={letterWidgets}
    />
  );
}

function parseJson(value: string) {
  try {
    return { text: value, value: JSON.parse(value as string), error: null };
  } catch (error) {
    return { text: value, value: null, error: (error as Error).message };
  }
}

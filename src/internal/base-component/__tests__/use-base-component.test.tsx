// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { COMPONENT_METADATA_KEY } from "@cloudscape-design/component-toolkit/internal";

import useBaseComponent, {
  InternalBaseComponentProps,
} from "../../../../lib/components/internal/base-component/use-base-component";
import { PACKAGE_SOURCE, PACKAGE_VERSION } from "../../../../lib/components/internal/environment";

type InternalDemoProps = InternalBaseComponentProps;
function InternalDemo({ __internalRootRef }: InternalDemoProps) {
  return <div ref={__internalRootRef}>Internal Demo Component</div>;
}

declare global {
  interface Node {
    [COMPONENT_METADATA_KEY]?: { name: string; version: string; packageName: string; theme: string };
  }
}

function Demo() {
  const baseComponentProps = useBaseComponent("DemoComponent");
  return <InternalDemo {...baseComponentProps} />;
}

vi.mock("../../../../lib/components/internal/utils/get-visual-theme", async (importOriginal) => {
  return { ...(await importOriginal()), getVisualTheme: vi.fn(() => "test theme") };
});

afterEach(() => {
  vi.resetAllMocks();
});

test("should attach the metadata to the returned root DOM node", () => {
  const { container } = render(<Demo />);
  const rootNode = container.firstChild;
  expect(rootNode![COMPONENT_METADATA_KEY]!.name).toBe("DemoComponent");
  expect(rootNode![COMPONENT_METADATA_KEY]!.version).toBe(PACKAGE_VERSION);
  expect(rootNode![COMPONENT_METADATA_KEY]!.theme).toBe("test theme");
  expect(rootNode![COMPONENT_METADATA_KEY]!.packageName).toBe(PACKAGE_SOURCE);
});

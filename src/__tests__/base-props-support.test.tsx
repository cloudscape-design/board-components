// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { render } from "@testing-library/react";
import { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { defaultProps, wrappers } from "./default-props";
import { getAllComponents, requireComponent } from "./utils";

describe.each<string>(getAllComponents())(`base props support for %s`, async (componentName: string) => {
  const Component = await requireComponent(componentName);
  const props = defaultProps[componentName as keyof typeof defaultProps];
  const wrapper = wrappers[componentName as keyof typeof wrappers];

  function renderComponent(ui: ReactElement) {
    return render(ui, { wrapper });
  }

  test("should allow data-attributes", () => {
    const { container } = renderComponent(<Component {...props} data-testid="example" />);
    expect(container.firstElementChild).toHaveAttribute("data-testid", "example");
  });

  test("should not allow id", () => {
    const { container } = renderComponent(<Component {...props} id="example" />);
    expect(container.querySelector("#example")).toBeNull();
  });

  test("should not allow className", () => {
    const { container } = renderComponent(<Component {...props} className="example" />);
    expect(container.querySelector(".example")).toBeNull();
  });

  test("should not allow arbitrary attributes", () => {
    const { container } = renderComponent(<Component {...props} not-allowed={true} />);
    expect(container.querySelector("[not-allowed]")).toBeNull();
  });

  test("data- properties should only apply to one element", () => {
    const { container } = renderComponent(<Component {...props} data-testid="data" />);
    expect(container.querySelectorAll("[data-testid=data]")).toHaveLength(1);
  });
});

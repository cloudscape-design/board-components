// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ComponentType } from "react";
import { render } from "@testing-library/react";
import { paramCase, pascalCase } from "change-case";
import { describe, expect, test } from "vitest";

import * as components from "../../lib/components";
import createWrapperDom, { ElementWrapper as DomElementWrapper } from "../../lib/components/test-utils/dom";
import createWrapperSelectors from "../../lib/components/test-utils/selectors";
import { ItemContextWrapper } from "../board-item/__tests__/board-item-wrapper";
import { defaultProps } from "./default-props";

const componentWithMultipleRootElements = ["Board", "ItemsPalette"];
const componentNames = Object.keys(components).filter(
  (component) => !componentWithMultipleRootElements.includes(component),
);

const RENDER_COMPONENTS_DEFAULT_PROPS: Record<string, unknown>[] = [
  {
    "data-testid": "first-item",
    "data-name": "first item",
  },
  {
    "data-testid": "second-item",
    "data-name": "second item",
  },
];

function renderComponents(componentName: string, props = RENDER_COMPONENTS_DEFAULT_PROPS) {
  const Component = components[componentName as keyof typeof components] as ComponentType;
  const componentDefaultProps = defaultProps[paramCase(componentName) as keyof typeof defaultProps];
  return render(
    <div>
      {props.map(({ ...customProps }, index) => (
        <Component key={index} {...componentDefaultProps} {...customProps} />
      ))}
    </div>,
    { wrapper: ItemContextWrapper },
  );
}

function getComponentSelectors(componentName: string) {
  const componentNamePascalCase = pascalCase(componentName);
  const findAllRegex = new RegExp(`findAll${componentNamePascalCase}.*`);

  // The same set of selector functions are present in both dom and selectors.
  // For this reason, looking into DOM is representative of both groups.
  const wrapperPropsList = Object.keys(DomElementWrapper.prototype);

  // Every component has the same set of selector functions.
  // For this reason, casting the function names into the Board component.
  const findName = `find${componentNamePascalCase}` as "findBoard";
  const findAllName = wrapperPropsList.find((selector) => findAllRegex.test(selector)) as "findAllBoards";

  return { findName, findAllName };
}

describe.each(componentNames)("ElementWrapper selectors for %s component", (componentName) => {
  const { findName, findAllName } = getComponentSelectors(componentName);

  describe("dom wrapper", () => {
    test(`${findName} returns the first ${componentName}`, () => {
      const { container } = renderComponents(componentName);
      const wrapper = createWrapperDom(container);
      const element = wrapper[findName]()!.getElement();

      expect(element).toHaveAttribute("data-name", "first item");
    });

    test(`${findAllName} returns all of the ${componentName} components`, () => {
      const { container } = renderComponents(componentName);
      const wrapper = createWrapperDom(container);
      const elementNameAttributes = wrapper[findAllName]().map((component) =>
        component!.getElement().getAttribute("data-name"),
      );

      expect(elementNameAttributes).toEqual(["first item", "second item"]);
    });

    test(`${findAllName} returns only the matching ${componentName} components, when a selector is specified`, () => {
      const { container } = renderComponents(componentName, [
        { "data-type": "first-type", "data-name": "first item" },
        { "data-type": "second-type", "data-name": "second item" },
        { "data-type": "second-type", "data-name": "third item" },
      ]);
      const wrapper = createWrapperDom(container);
      const elementNameAttributes = wrapper[findAllName]("[data-type=second-type]").map((component) =>
        component!.getElement().getAttribute("data-name"),
      );

      expect(elementNameAttributes).toEqual(["second item", "third item"]);
    });
  });

  describe("selectors wrapper", () => {
    test(`${findName} returns a selector that matches the ${componentName}`, () => {
      const { container } = renderComponents(componentName);
      const wrapper = createWrapperSelectors();
      const selector = wrapper[findName]().toSelector();
      const element = container.querySelector(selector);

      expect(element).toHaveAttribute("data-name", "first item");
    });

    test(`${findAllName} returns a selector that matches the ${componentName} with nth-child index`, () => {
      const { container } = renderComponents(componentName);
      const wrapper = createWrapperSelectors();
      const selector = wrapper[findAllName]().get(2).toSelector();
      const element = container.querySelector(selector);

      expect(element).toHaveAttribute("data-name", "second item");
    });

    test(`${findAllName} appends the specified selector to the default ${componentName} selectors`, () => {
      const { container } = renderComponents(componentName, [
        { "data-type": "first-type", "data-name": "first item" },
        { "data-type": "second-type", "data-name": "second item" },
      ]);
      const wrapper = createWrapperSelectors();
      const firstElement = container.querySelector(wrapper[findAllName]("[data-type=second-type]").get(1).toSelector());
      const secondElement = container.querySelector(
        wrapper[findAllName]("[data-type=second-type]").get(2).toSelector(),
      );

      expect(firstElement).toBeFalsy();
      expect(secondElement).toBeTruthy();
    });
  });
});

describe.each(componentWithMultipleRootElements)("ElementWrapper selectors for %s component", (componentName) => {
  const { findName, findAllName } = getComponentSelectors(componentName);

  describe("dom wrapper", () => {
    test(`${findName} returns the first ${componentName}`, () => {
      const { container } = renderComponents(componentName);
      const wrapper = createWrapperDom(container);
      const element = wrapper[findName]()!.getElement();

      expect(element.closest("[data-name]")).toHaveAttribute("data-name", "first item");
    });

    test(`${findAllName} returns all of the ${componentName} components`, () => {
      const { container } = renderComponents(componentName);
      const wrapper = createWrapperDom(container);
      const elementNameAttributes = wrapper[findAllName]().map((component) =>
        component!.getElement()!.closest("[data-name]")!.getAttribute("data-name"),
      );

      expect(elementNameAttributes).toEqual(["first item", "second item"]);
    });
  });

  describe("selectors wrapper", () => {
    test(`${findName} returns a selector that matches the ${componentName}`, () => {
      const { container } = renderComponents(componentName);
      const wrapper = createWrapperSelectors();
      const selector = wrapper[findName]().toSelector();
      const element = container.querySelector(selector);

      expect(element!.closest("[data-name]")).toHaveAttribute("data-name", "first item");
    });

    test(`${findAllName} returns a selector that matches the ${componentName}`, () => {
      const { container } = renderComponents(componentName);
      const wrapper = createWrapperSelectors();
      const selector = wrapper[findAllName]().toSelector();
      const element = container.querySelector(selector);

      expect(element!.closest("[data-name]")).toHaveAttribute("data-name", "first item");
    });
  });
});

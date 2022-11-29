import { ElementWrapper } from "@cloudscape-design/test-utils-core/dom";
import { appendSelector } from "@cloudscape-design/test-utils-core/utils";
export { ElementWrapper };

import DashboardWrapper from "./dashboard/index";
export { DashboardWrapper };

import DashboardItemWrapper from "./dashboard-item/index";
export { DashboardItemWrapper };

declare module "@cloudscape-design/test-utils-core/dist/dom" {
  interface ElementWrapper {
    findDashboard(selector?: string): DashboardWrapper | null;
    findDashboardItem(selector?: string): DashboardItemWrapper | null;
  }
}
ElementWrapper.prototype.findDashboard = function (selector) {
  const rootSelector = `.${DashboardWrapper.rootSelector}`;
  // casting to 'any' is needed to avoid this issue with generics
  // https://github.com/microsoft/TypeScript/issues/29132
  return (this as any).findComponent(
    selector ? appendSelector(selector, rootSelector) : rootSelector,
    DashboardWrapper
  );
};
ElementWrapper.prototype.findDashboardItem = function (selector) {
  const rootSelector = `.${DashboardItemWrapper.rootSelector}`;
  // casting to 'any' is needed to avoid this issue with generics
  // https://github.com/microsoft/TypeScript/issues/29132
  return (this as any).findComponent(
    selector ? appendSelector(selector, rootSelector) : rootSelector,
    DashboardItemWrapper
  );
};
export function createWrapper(root: Element = document.body) {
  if (document && document.body && !document.body.contains(root)) {
    console.warn(
      "[AwsUi] [test-utils] provided element is not part of the document body, interactions may work incorrectly"
    );
  }
  return new ElementWrapper(root);
}

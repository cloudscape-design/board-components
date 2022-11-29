import { ElementWrapper } from "@cloudscape-design/test-utils-core/selectors";
import { appendSelector } from "@cloudscape-design/test-utils-core/utils";
export { ElementWrapper };

import DashboardWrapper from "./dashboard/index";
export { DashboardWrapper };

import DashboardItemWrapper from "./dashboard-item/index";
export { DashboardItemWrapper };

declare module "@cloudscape-design/test-utils-core/dist/selectors" {
  interface ElementWrapper {
    findDashboard(selector?: string): DashboardWrapper;
    findDashboardItem(selector?: string): DashboardItemWrapper;
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
export function createWrapper(root: string = "body") {
  return new ElementWrapper(root);
}

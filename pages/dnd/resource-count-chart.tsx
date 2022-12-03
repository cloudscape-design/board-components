// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import PieChart from "@cloudscape-design/components/pie-chart";

export function ResourceCountChart({ size }: { size: "small" | "medium" | "large" }) {
  return (
    <PieChart
      size={size}
      hideFilter={true}
      hideLegend={false}
      data={[
        {
          title: "Running",
          value: 60,
          lastUpdate: "Dec 7, 2020",
        },
        {
          title: "Failed",
          value: 30,
          lastUpdate: "Dec 6, 2020",
        },
        {
          title: "In-progress",
          value: 10,
          lastUpdate: "Dec 6, 2020",
        },
        {
          title: "Pending",
          value: 0,
          lastUpdate: "Dec 7, 2020",
        },
      ]}
      detailPopoverContent={(datum, sum) => [
        { key: "Resource count", value: datum.value },
        {
          key: "Percentage",
          value: `${((datum.value / sum) * 100).toFixed(0)}%`,
        },
        { key: "Last update on", value: datum.lastUpdate },
      ]}
      segmentDescription={(datum, sum) => `${datum.value} units, ${((datum.value / sum) * 100).toFixed(0)}%`}
      i18nStrings={{
        detailsValue: "Value",
        detailsPercentage: "Percentage",
        filterLabel: "Filter displayed data",
        filterPlaceholder: "Filter data",
        filterSelectedAriaLabel: "selected",
        detailPopoverDismissAriaLabel: "Dismiss",
        legendAriaLabel: "Legend",
        chartAriaRoleDescription: "pie chart",
        segmentAriaRoleDescription: "segment",
      }}
      ariaDescription="Pie chart showing how many resources are currently in which state."
      ariaLabel="Pie chart"
      errorText="Error loading data."
      loadingText="Loading chart"
      recoveryText="Retry"
      empty="Empty"
      noMatch="No match"
    />
  );
}

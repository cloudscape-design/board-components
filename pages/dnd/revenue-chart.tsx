// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import BarChart from "@cloudscape-design/components/bar-chart";

export function RevenueChart({ height }: { height: number }) {
  return (
    <BarChart
      height={height}
      hideFilter={true}
      hideLegend={false}
      series={[
        {
          title: "Site 1",
          type: "bar",
          data: [
            { x: new Date(1601071200000), y: 34503 },
            { x: new Date(1601078400000), y: 25832 },
            { x: new Date(1601085600000), y: 4012 },
            { x: new Date(1601092800000), y: -5602 },
            { x: new Date(1601100000000), y: 17839 },
          ],
          valueFormatter: (value) => "$" + value.toLocaleString("en-US"),
        },
        {
          title: "Average revenue",
          type: "threshold",
          y: 19104,
          valueFormatter: (value) => "$" + value.toLocaleString("en-US"),
        },
      ]}
      xDomain={[
        new Date(1601071200000),
        new Date(1601078400000),
        new Date(1601085600000),
        new Date(1601092800000),
        new Date(1601100000000),
      ]}
      yDomain={[-10000, 40000]}
      i18nStrings={{
        filterLabel: "Filter displayed data",
        filterPlaceholder: "Filter data",
        filterSelectedAriaLabel: "selected",
        detailPopoverDismissAriaLabel: "Dismiss",
        legendAriaLabel: "Legend",
        chartAriaRoleDescription: "bar chart",
        xTickFormatter: (tick) =>
          tick
            .toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
              hour12: !1,
            })
            .split(",")
            .join("\n"),
        yTickFormatter(value) {
          return Math.abs(value) >= 1e9
            ? (value / 1e9).toFixed(1).replace(/\.0$/, "") + "G"
            : Math.abs(value) >= 1e6
              ? (value / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
              : Math.abs(value) >= 1e3
                ? (value / 1e3).toFixed(1).replace(/\.0$/, "") + "K"
                : value.toFixed(2);
        },
      }}
      ariaLabel="Single data series bar chart"
      errorText="Error loading data."
      loadingText="Loading chart"
      recoveryText="Retry"
      xScaleType="categorical"
      xTitle="Time (UTC)"
      yTitle="Revenue (USD)"
      empty="Empty"
      noMatch="No match"
    />
  );
}

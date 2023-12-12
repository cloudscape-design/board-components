// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Link from "@cloudscape-design/components/link";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Table from "@cloudscape-design/components/table";

interface EventItem {
  id: string;
  name: string;
  type: string;
  statusText: string;
  status: "error" | "warning" | "success" | "pending";
}

export function EventsTable() {
  const eventsDefinition = [
    {
      id: "name",
      header: "Event name",
      cell: (item: EventItem) => item.name,
      minWidth: 135,
      width: 140,
    },
    {
      id: "status",
      header: "Event status",
      cell: ({ statusText, status }: EventItem) => <StatusIndicator type={status}>{statusText}</StatusIndicator>,
      minWidth: 120,
      width: 130,
    },
    {
      id: "id",
      header: "Event ID",
      cell: (item: EventItem) => <Link href="#">{item.id}</Link>,
      minWidth: 165,
      width: 170,
    },
    {
      id: "type",
      header: "Event type",
      cell: (item: EventItem) => item.type,
      minWidth: 130,
      width: 135,
    },
  ];
  const eventsItems = [
    {
      name: "my-instance-1",
      id: "i-b4b5f3b29ac6f0e",
      type: "instance-stop",
      statusText: "Scheduled",
      status: "pending",
    },
    {
      name: "my-instance-2",
      id: "i-f0eb5f329ab4bc6",
      type: "instance-stop",
      statusText: "Scheduled",
      status: "pending",
    },
    {
      name: "my-instance-3",
      id: "i-29ab4bebc6f05f3",
      type: "instance-stop",
      statusText: "Ongoing",
      status: "success",
    },
    {
      name: "my-instance-4",
      id: "i-329ab4bc6f0eb5f",
      type: "instance-stop",
      statusText: "Ongoing",
      status: "success",
    },
    {
      name: "my-instance-5",
      id: "i-b4beb29a5f3c6f0",
      type: "instance-stop",
      statusText: "Ongoing",
      status: "success",
    },
    {
      name: "my-instance-6",
      id: "i-f0eb5f329ab4bc6",
      type: "instance-stop",
      statusText: "Ongoing",
      status: "success",
    },
    {
      name: "my-instance-7",
      id: "i-9ab4bc6f0eb5f32",
      type: "instance-stop",
      statusText: "Ongoing",
      status: "success",
    },
  ];
  return <Table variant="embedded" resizableColumns={true} items={eventsItems} columnDefinitions={eventsDefinition} />;
}

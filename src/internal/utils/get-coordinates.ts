// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { PointerEvent as ReactPointerEvent } from "react";
import { Coordinates } from "../interfaces";

export function getCoordinates(event: PointerEvent | ReactPointerEvent<unknown>): Coordinates {
  return { __type: "Coordinates", x: event.clientX, y: event.clientY };
}

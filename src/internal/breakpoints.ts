// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Ref } from "react";

export function useContainerColumns(): [number, Ref<HTMLDivElement>] {
  const [columns, containerQueryRef] = useContainerQuery((entry) => {
    if (entry.contentBoxWidth < 688) {
      return 1;
    }
    if (entry.contentBoxWidth < 912) {
      return 2;
    }
    if (entry.contentBoxWidth < 2160) {
      return 4;
    }
    return 6;
  }, []);

  return [columns ?? 6, containerQueryRef];
}

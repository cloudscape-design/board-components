// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import SpaceBetween from "@cloudscape-design/components/space-between";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <FormField label="Enter your phone number">
      <SpaceBetween size="xs" direction="horizontal">
        <Button
          iconSvg={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
              <line x1="15" y1="8" x2="1" y2="8" />
            </svg>
          }
          onClick={() => setCount(count - 1)}
        />
        <Box fontSize="body-m" padding={{ vertical: "xxs" }}>
          +{count}
        </Box>
        <Button iconName="add-plus" onClick={() => setCount(count + 1)} />
      </SpaceBetween>
    </FormField>
  );
}

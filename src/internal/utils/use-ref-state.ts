// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useRef, useState } from "react";

export function useRefState<T>(initialValue: T): [() => T, T, (newValue: T) => void] {
  const valueRef = useRef(initialValue);
  const [valueState, setValueState] = useState(initialValue);

  const getValue = useCallback(() => valueRef.current, []);

  const setValue = useCallback((newValue: T) => {
    valueRef.current = newValue;
    setValueState(newValue);
  }, []);

  return [getValue, valueState, setValue];
}

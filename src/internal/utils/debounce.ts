// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface DebouncedFunction<F extends (...args: any) => any> {
  (...args: Parameters<F>): void;
  cancel(): void;
}

export function debounce<F extends (...args: any[]) => void>(func: F, delay: number): DebouncedFunction<F> {
  let cancelled = false;
  let timeout: ReturnType<typeof setTimeout> | null;

  function debounced(...args: any[]) {
    cancelled = false;

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      !cancelled && func(...args);
    }, delay);
  }

  debounced.cancel = () => {
    cancelled = true;
  };

  return debounced;
}

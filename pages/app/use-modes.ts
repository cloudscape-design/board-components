// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { applyDensity, applyMode, Density, disableMotion, Mode } from "@cloudscape-design/global-styles";

export interface AppUrlParams {
  mode: Mode;
  density: Density;
  direction: "ltr" | "rtl";
  motionDisabled: boolean;
}

export const defaults: AppUrlParams = {
  mode: Mode.Light,
  density: Density.Comfortable,
  direction: "ltr",
  motionDisabled: false,
};

function castToBoolean(s: string) {
  if (s === "true" || s === "false") {
    return s === "true";
  }
  return s;
}

export function parseQuery(urlParams: URLSearchParams) {
  const queryParams: Record<string, any> = { ...defaults };
  urlParams.forEach((value, key) => (queryParams[key] = castToBoolean(value)));
  return queryParams as AppUrlParams;
}

export function formatQuery(params: AppUrlParams) {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === defaults[key as keyof AppUrlParams]) {
      continue;
    }
    query[key] = String(value);
  }
  return query;
}

export default function useModes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlParams = parseQuery(searchParams);
  const { density, direction, mode, motionDisabled } = urlParams;

  function setParams(newParams: Partial<AppUrlParams>) {
    setSearchParams(formatQuery({ ...urlParams, ...newParams }));
  }

  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  useEffect(() => {
    applyDensity(density);
  }, [density]);

  useEffect(() => {
    disableMotion(motionDisabled);
  }, [motionDisabled]);

  useEffect(() => {
    document.documentElement.setAttribute("dir", direction);
  }, [direction]);

  return { density, direction, mode, motionDisabled, setParams };
}

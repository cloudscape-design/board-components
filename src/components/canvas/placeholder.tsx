// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import React from "react";

import styles from "./styles.css.js";

export type PlaceholderState = "default" | "active" | "error";

export interface PlaceholderProps {
  state: PlaceholderState;
}

function Placeholder({ state }: PlaceholderProps) {
  return <div className={clsx(styles.placeholder, styles[`placeholder--${state}`])} />;
}

export default React.memo(Placeholder);

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "@cloudscape-design/global-styles/index.css";

import App from "./app";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

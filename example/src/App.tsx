import React, { VFC } from "react";

import { K8sViewer } from "./reactComponentLib";

import manifests from "./example.json";

export const App: VFC = () => (
  <div style={{ width: "100%", height: 800, fontSize: "1.5em" }}>
    <K8sViewer manifests={manifests} />
  </div>
);

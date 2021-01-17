import React, { VFC } from "react";

import { K8sViewer } from "./reactComponentLib";

import yaml from "yaml.macro";

const manifests = yaml("./example.yaml");

console.log("manifests", manifests);

export const App: VFC = () => (
  <div style={{ width: "100%", height: 800, fontSize: "1.5em" }}>
    <K8sViewer manifests={manifests} />
  </div>
);

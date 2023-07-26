import typescript from "@rollup/plugin-typescript";
import json from "@rollup/plugin-json";

import pkg from "./package.json" assert { type: "json" };

const input = "src/index.ts";
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const plugins = [
  json(),
  typescript({ exclude: [/\.stories\..*/, "src/setupTest.ts"] }),
];

export default [
  {
    external,
    input,
    output: {
      file: pkg.module,
      format: "esm",
      sourcemap: true,
    },
    plugins,
  },
  {
    external,
    input,
    output: {
      file: pkg.main,
      format: "cjs",
      sourcemap: true,
    },
    plugins,
  },
];

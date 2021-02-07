import initStoryshots from "@storybook/addon-storyshots";
import { render } from "@testing-library/react";

const reactTestingLibrarySerializer = {
  //@ts-expect-error
  print: (val, serialize, indent) => serialize(val.container.firstChild),
  //@ts-expect-error
  test: (val) => val && val.hasOwnProperty("container"),
};

initStoryshots({
  renderer: render,
  snapshotSerializers: [reactTestingLibrarySerializer],
});

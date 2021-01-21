import { parseManifests } from "./parseManifests";

const fixtures = [
  "basic.json",
  "ingress-hosts.json",
  "sample-next-app.json",
  "sealed-secret.json",
];

describe("parseManifests()", () => {
  fixtures.forEach((fixture) => {
    test(`parse ${fixture}`, () => {
      const data = require(`../../fixtures/${fixture}`);
      expect(parseManifests(data)).toMatchSnapshot();
    });
  });
});

module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  transform: { "^.+\\.ts$": "ts-jest" },
  testRegex: "test/.*\\.e2e-spec\\.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
};

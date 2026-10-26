module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  transform: { "^.+\\.ts$": "ts-jest" },
  testRegex: "test/.*\\.e2e-spec\\.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
  // Every suite seeds and clears the same database, so they must not run in parallel.
  maxWorkers: 1,
};

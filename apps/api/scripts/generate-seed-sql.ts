import { writeFileSync } from "node:fs";

import { SEED_FILE } from "./paths";
import { buildSeedSql } from "./seedSql";

writeFileSync(SEED_FILE, buildSeedSql());
console.log(`Wrote ${SEED_FILE}`);

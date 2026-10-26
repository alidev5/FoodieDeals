const { appendFileSync, readFileSync } = require("node:fs");
const { join } = require("node:path");

const { withAppBuildGradle, withDangerousMod } = require("expo/config-plugins");

/**
 * The Stripe SDK references its optional push-provisioning library, which needs Google's
 * private play-services-tapandpay package. The app doesn't use push provisioning, so:
 * - release lint is turned off (its library scan tries to resolve that package), and
 * - R8 is told not to fail on the push-provisioning classes that are never shipped.
 */
const PROGUARD_RULE = "-dontwarn com.stripe.android.pushProvisioning.**";

function withoutReleaseLint(config) {
  return withAppBuildGradle(config, (gradle) => {
    const marker = "checkReleaseBuilds false";
    if (!gradle.modResults.contents.includes(marker)) {
      gradle.modResults.contents = gradle.modResults.contents.replace(
        /\nandroid\s*\{/,
        `\nandroid {\n    lint {\n        ${marker}\n        abortOnError false\n    }`,
      );
    }
    return gradle;
  });
}

function withPushProvisioningProguardRule(config) {
  return withDangerousMod(config, [
    "android",
    (modConfig) => {
      const rulesFile = join(modConfig.modRequest.platformProjectRoot, "app", "proguard-rules.pro");
      if (!readFileSync(rulesFile, "utf8").includes(PROGUARD_RULE)) {
        appendFileSync(rulesFile, `\n${PROGUARD_RULE}\n`);
      }
      return modConfig;
    },
  ]);
}

module.exports = function withoutStripePushProvisioning(config) {
  return withPushProvisioningProguardRule(withoutReleaseLint(config));
};

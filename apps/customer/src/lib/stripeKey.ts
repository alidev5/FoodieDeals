export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const IS_STRIPE_TEST_MODE = STRIPE_PUBLISHABLE_KEY.startsWith("pk_test_");

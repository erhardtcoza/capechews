export function bindEnv(env) {
  // basic presence checks
  return {
    ...env,
    AGE_MIN: Number(env.AGE_MIN || 18),
    LEGAL_THC: String(env.LEGAL_THC || "false") === "true",
  };
}

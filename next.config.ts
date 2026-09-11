import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// Build stamp shown in the UI (sidebar footer) so it's obvious which commit
// a running instance is on. Auto-derived at build time — nothing to bump by
// hand. On Vercel the commit sha comes from the environment; locally it's
// read from git. The date is the build date.
function gitShort(): string {
  const fromEnv =
    process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "";
  if (fromEnv) return fromEnv.slice(0, 7);
  try {
    return execSync("git rev-parse --short=7 HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_SHA: gitShort(),
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString().slice(0, 10),
  },
};

export default nextConfig;

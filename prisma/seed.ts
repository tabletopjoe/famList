/**
 * Seeds family member accounts. There's no public sign-up page (this app is
 * hosted for the family, not the internet at large), so accounts are
 * created here instead. Add an entry to `familyMembers` below (no password
 * needed — a random temporary one is generated and printed once), then run:
 *
 *   npm run db:seed
 *
 * The new account is created with mustChangePassword set, so the printed
 * password only needs to make it to that person once — they're forced to
 * pick their own on first login (see src/modules/settings).
 *
 * It's safe to re-run — existing emails are skipped, not overwritten.
 */
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Not importing src/lib/auth/password.ts here: it's marked "server-only",
// which is enforced even outside Next's build (this script runs under
// plain tsx/Node), so it throws unconditionally if imported directly.
const hashPassword = (plain: string) => bcrypt.hash(plain, 10);

function generateTempPassword() {
  return crypto.randomBytes(9).toString("base64url"); // 12 url-safe chars
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

const familyMembers = [
  { name: "Helio", email: "schlenkster@gmail.com", role: "admin" },
  { name: "Lizaloo", email: "liza.avruch@gmail.com", role: "admin" },
  // Add more family members here, e.g.:
  // { name: "Jamie", email: "jamie@example.com", role: "member" },
];

async function main() {
  for (const member of familyMembers) {
    const existing = await db.user.findUnique({ where: { email: member.email } });
    if (existing) {
      console.log(`Skipping ${member.email} — already exists.`);
      continue;
    }
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    await db.user.create({
      data: {
        name: member.name,
        email: member.email,
        passwordHash,
        role: member.role,
        mustChangePassword: true,
      },
    });
    console.log(`Created ${member.email} (temp password: ${tempPassword}) — share this once; they'll be made to set their own on first login.`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });

/**
 * Seeds family member accounts. There's no public sign-up page (this app is
 * hosted for the family, not the internet at large), so accounts are
 * created here instead. Edit the `familyMembers` list below to add
 * everyone, then run:
 *
 *   npm run db:seed
 *
 * It's safe to re-run — existing emails are skipped, not overwritten.
 */
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// Not importing src/lib/auth/password.ts here: it's marked "server-only",
// which is enforced even outside Next's build (this script runs under
// plain tsx/Node), so it throws unconditionally if imported directly.
const hashPassword = (plain: string) => bcrypt.hash(plain, 10);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const db = new PrismaClient({ adapter });

const familyMembers = [
  {
    name: "Helio",
    email: "schlenkster@gmail.com",
    password: "DWgJwbZnAnAc", // CHANGE THIS after first login — see README
    role: "admin",
  },
  // Add more family members here, e.g.:
  // { name: "Jamie", email: "jamie@example.com", password: "pick-something", role: "member" },
];

async function main() {
  for (const member of familyMembers) {
    const existing = await db.user.findUnique({ where: { email: member.email } });
    if (existing) {
      console.log(`Skipping ${member.email} — already exists.`);
      continue;
    }
    const passwordHash = await hashPassword(member.password);
    await db.user.create({
      data: { name: member.name, email: member.email, passwordHash, role: member.role },
    });
    console.log(`Created ${member.email} (temp password: ${member.password})`);
  }
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });

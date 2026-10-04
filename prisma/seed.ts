/**
 * prisma/seed.ts — Default seed data for Harmonic multi-tenant environment
 *
 * Seeds:
 * 1. Default Administrator user: admin@harmonic.ai
 * 2. Default Member user: sam@harmonic.ai
 * 3. Default Workspace: "Harmonic Core" (slug: "harmonic-core")
 * 4. Default Channel: "general"
 * 5. Workspace memberships with proper roles (ADMIN, MEMBER)
 */

import { PrismaClient, MemberRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://user:password@localhost:5432/harmoniq?schema=public";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Harmonic database...");

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const userPasswordHash = await bcrypt.hash("user123", 10);

  // 1. Upsert Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@harmonic.ai" },
    update: {
      name: "Harmonic Admin",
      passwordHash: adminPasswordHash,
    },
    create: {
      email: "admin@harmonic.ai",
      name: "Harmonic Admin",
      passwordHash: adminPasswordHash,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=admin",
    },
  });
  console.log(`✓ Admin user: ${admin.email} (id: ${admin.id})`);

  // 2. Upsert Demo Member
  const sam = await prisma.user.upsert({
    where: { email: "sam@harmonic.ai" },
    update: {
      name: "Sam (Frontend Eng)",
      passwordHash: userPasswordHash,
    },
    create: {
      email: "sam@harmonic.ai",
      name: "Sam (Frontend Eng)",
      passwordHash: userPasswordHash,
      avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=sam",
    },
  });
  console.log(`✓ Member user: ${sam.email} (id: ${sam.id})`);

  // 3. Upsert Default Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "harmonic-core" },
    update: {
      name: "Harmonic Core",
      ownerId: admin.id,
    },
    create: {
      name: "Harmonic Core",
      slug: "harmonic-core",
      ownerId: admin.id,
    },
  });
  console.log(`✓ Workspace: ${workspace.name} (${workspace.slug})`);

  // 4. Ensure Workspace Memberships
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: admin.id,
      },
    },
    update: { role: MemberRole.ADMIN },
    create: {
      workspaceId: workspace.id,
      userId: admin.id,
      role: MemberRole.ADMIN,
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: sam.id,
      },
    },
    update: { role: MemberRole.MEMBER },
    create: {
      workspaceId: workspace.id,
      userId: sam.id,
      role: MemberRole.MEMBER,
    },
  });
  console.log("✓ Workspace memberships assigned");

  // 5. Upsert Default Channel
  const channel = await prisma.channel.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: "general",
      },
    },
    update: { topic: "Main accessibility workstation discussions" },
    create: {
      workspaceId: workspace.id,
      name: "general",
      topic: "Main accessibility workstation discussions",
    },
  });
  console.log(`✓ Default channel: #${channel.name}`);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.warn("⚠️  Seed warning (DB might be offline/unconfigured):", e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

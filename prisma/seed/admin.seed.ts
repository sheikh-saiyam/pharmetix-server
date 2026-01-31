import "dotenv/config";

import { prisma } from "../../src/lib/prisma";
import { UserRole } from "./../../generated/prisma/enums";
import { env } from "./../../src/config/env";

async function seedAdmin() {
  try {
    const admin = {
      name: env.APP_ADMIN,
      email: env.APP_ADMIN_EMAIL,
      password: env.APP_ADMIN_PASS,
      role: UserRole.ADMIN,
    };

    const isExists = await prisma.user.findUnique({
      where: { email: admin.email },
    });

    if (isExists) {
      throw new Error("Admin user already exists!");
    }

    // Sign up admin user via Better Auth API
    const signUpAdmin = await fetch(
      `${env.APP_ORIGIN}/api/auth/sign-up/email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: env.BETTER_AUTH_URL,
        },
        body: JSON.stringify(admin),
      },
    );

    if (!signUpAdmin.ok) {
      console.log({ signUpAdmin });
      throw new Error(
        `Failed to sign up admin user: ${signUpAdmin.statusText}`,
      );
    }

    // Verify admin email
    if (signUpAdmin.ok) {
      await prisma.user.update({
        where: { email: admin.email },
        data: { emailVerified: true },
      });
      console.log("Admin user created successfully:", signUpAdmin.status);
    }
  } catch (error) {
    console.error("Admin Seed Error:", error instanceof Error ? error : error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();

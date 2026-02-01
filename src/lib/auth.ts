import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { env } from "../config/env";
import { prisma } from "./prisma";

export const auth = betterAuth({
  appName: "Pharmetix",
  trustedOrigins: [env.APP_ORIGIN],

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: UserRole.CUSTOMER,
      },
      status: {
        type: "string",
        defaultValue: UserStatus.ACTIVE,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  socialProviders: {
    github: {
      clientId: "your-client-id",
      clientSecret: "your-client-secret",
      // redirectURI: "https://example.com/api/auth/callback/github",
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      // 🚫 Block admin role
      if (ctx.body.role && ctx.body.role === UserRole.ADMIN) {
        throw new APIError("BAD_REQUEST", {
          message: "Admin role cannot be assigned!",
        });
      }

      // 🚫 Block invalid initial status
      if (
        (ctx.body.status && ctx.body.status === UserStatus.BANNED) ||
        ctx.body.status === UserStatus.INACTIVE
      ) {
        throw new APIError("BAD_REQUEST", {
          message: "Invalid status for new users, must be ACTIVE!",
        });
      }
    }),
  },

  secret: env.BETTER_AUTH_SECRET,
});

import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { env } from "../config/env";
import { prisma } from "./prisma";

export const auth = betterAuth({
  appName: "Pharmetix",

  trustedOrigins: [env.APP_ORIGIN, env.PROD_APP_ORIGIN],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 3, // 3d in ms
    },
  },
  advanced: {
    cookiePrefix: "better-auth",
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
    disableCSRFCheck: true, // Allow requests without Origin header (Postman, mobile apps, etc.)
  },

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

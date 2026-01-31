import { betterAuth } from "better-auth";
import { prisma } from "./prisma";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "../config/env";
import { UserRole, UserStatus } from "../../generated/prisma/enums";

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
        default: UserRole.CUSTOMER,
      },
      status: {
        type: "string",
        default: UserStatus.ACTIVE,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  secret: env.BETTER_AUTH_SECRET,
});

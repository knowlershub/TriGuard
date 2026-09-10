import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import authConfig from "@/auth.config";
import { prisma } from "@/lib/prisma";

class EmailNotFoundError extends CredentialsSignin {
  code = "email_not_found";
}

class WrongPasswordError extends CredentialsSignin {
  code = "wrong_password";
}

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class UserNotFoundError extends CredentialsSignin {
  code = "user_not_found";
}

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  ...authConfig,

  session: {
    strategy: "jwt",
  },

  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const email = String(
          credentials?.email ?? ""
        )
          .trim()
          .toLowerCase();

        const password = String(
          credentials?.password ?? ""
        );

        if (!email || !password) {
          throw new InvalidCredentialsError();
        }

        const account =
          await prisma.webAccount.findUnique({
            where: { email },
          });

        if (!account) {
          throw new EmailNotFoundError();
        }

        const passwordMatches =
          await bcrypt.compare(
            password,
            account.passwordHash
          );

        if (!passwordMatches) {
          throw new WrongPasswordError();
        }

        const user =
          await prisma.user.findUnique({
            where: {
              id: account.userId,
            },
          });

        if (!user) {
          throw new UserNotFoundError();
        }

        return {
          id: user.id,
          name: user.displayName,
          email: account.email,
        };
      },
    }),
  ],

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = String(
          token.userId
        );
      }

      return session;
    },
  },
});

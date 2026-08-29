import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export const {
  handlers,
  signIn,
  signOut,
  auth,
} = NextAuth({
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
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
          return null;
        }

        const account =
          await prisma.webAccount.findUnique({
            where: { email },
          });

        if (!account) {
          return null;
        }

        const passwordMatches =
          await bcrypt.compare(
            password,
            account.passwordHash
          );

        if (!passwordMatches) {
          return null;
        }

        const user =
          await prisma.user.findUnique({
            where: {
              id: account.userId,
            },
          });

        if (!user) {
          return null;
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
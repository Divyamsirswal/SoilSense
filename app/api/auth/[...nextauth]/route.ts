import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Define authOptions separately but don't export it directly from this file
const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("InvalidCredentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase().trim(),
          },
        });

        if (!user || !user.password) {
          throw new Error("UserNotFound");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("InvalidPassword");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = (token.name as string) || "";
        session.user.email = (token.email as string) || "";
        session.user.image = token.picture as string | undefined;
        session.user.role = (token.role as string) || "USER";
      }
      return session;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // Return previous token if the access token hasn't expired yet
      if (Date.now() < ((token.accessTokenExpires as number) || 0)) {
        return token;
      }

      // Update the token information from the database
      const dbUser = await prisma.user.findUnique({
        where: {
          email: token.email as string,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
        },
      });

      if (!dbUser) {
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
        role: dbUser.role,
        accessTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };
    },
  },
  events: {
    async signIn({ user }) {
      // Update last login time
      if (user.email) {
        await prisma.user.update({
          where: { email: user.email },
          data: {
            lastLogin: new Date(),
          },
        });
      }
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// Create handler with the options
const handler = NextAuth(authOptions);

// Export the handler functions directly
export { handler as GET, handler as POST };

// Export auth options from a separate file to avoid the type error
// Create auth-options.ts in the same directory and import from there when needed

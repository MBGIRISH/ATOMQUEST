import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";


export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Mock Entra ID",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // For hackathon demo, bypass actual password check and just fetch user by email
        // Or if it's "admin@demo.com", create it if missing
        
        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { department: true }
        });

        if (!user) {
          // Auto-provision demo users if they don't exist
          let role = "EMPLOYEE";
          if (credentials.email.startsWith("manager")) role = "MANAGER";
          if (credentials.email.startsWith("admin")) role = "ADMIN";
          
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.email.split("@")[0].toUpperCase(),
              role: role,
            },
            include: { department: true }
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.departmentId,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.departmentId = (user as any).departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
          departmentId: token.departmentId as string | null,
        } as any;
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  }
};

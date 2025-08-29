import type { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Temporarily disabled due to type issues
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    // signUp: '/auth/signup',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password required')
          }

          const user = await prisma.user.findUnique({
            where: { 
              email: credentials.email,
              deletedAt: null,
            },
          })

          if (!user || !user.password) {
            throw new Error('No user found with this email')
          }

          // Verify password with hashed version
          const isPasswordValid = await compare(credentials.password, user.password)
          
          if (!isPasswordValid) {
            throw new Error('Invalid password')
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
            createdAt: user.createdAt.toISOString(),
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.createdAt = user.createdAt
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.createdAt = token.createdAt as string
      }
      return session
    },
  },
}

// Helper to get server-side session
export { getServerSession } from 'next-auth'


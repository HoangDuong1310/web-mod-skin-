import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ROLES } from '@/lib/auth-utils'

export const authOptions: NextAuthOptions = {
  // Note: Database adapter cannot be used with CredentialsProvider
  // CredentialsProvider requires JWT strategy
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
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async jwt({ token, user }) {
      // When user signs in, store additional info in JWT
      if (user) {
        token.role = user.role
        token.createdAt = user.createdAt
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client, using JWT data
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.createdAt = token.createdAt as string

        // Kiểm tra role trong token và doublecheck với database nếu token claim role admin hoặc staff. Tránh JWT forging nếu ông bị lộ secret
        if (token.role === ROLES.ADMIN || token.role === ROLES.STAFF) {
          try {
            const freshUser = await prisma.user.findUnique({
              where: { id: token.sub! },
              select: { role: true }
            })
            if (!freshUser || freshUser.role !== token.role) {
              console.warn(`Err: Role in token: ${token.role} role in DB: ${freshUser?.role || 'null'}.`);
              session.user.role = ROLES.USER
            }
          } catch (error) {
            //Hạ role nếu của session nếu lỗi
            session.user.role = ROLES.USER
          }
        }
      }
      return session
    },
  },
}

// Helper to get server-side session
export { getServerSession } from 'next-auth'



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

          // Block unverified email users
          if (!user.emailVerified) {
            throw new Error('EMAIL_NOT_VERIFIED')
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
    async signIn({ user, account, profile }) {
      // OAuth sign-in (Google, GitHub) — auto create / link user
      if (account && account.provider !== 'credentials') {
        try {
          const email = user.email
          if (!email) return false

          // Check if user already exists
          let dbUser = await prisma.user.findUnique({
            where: { email },
            include: { accounts: true },
          })

          if (dbUser) {
            // Check if this OAuth provider is already linked
            const existingAccount = dbUser.accounts.find(
              (a) => a.provider === account.provider && a.providerAccountId === account.providerAccountId
            )

            if (!existingAccount) {
              // Check if another OAuth provider is already linked (prevent account hijacking)
              const hasOtherOAuth = dbUser.accounts.some(
                (a) => a.provider !== account.provider
              )

              // Link new OAuth provider to existing account
              await prisma.account.create({
                data: {
                  userId: dbUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token as string | undefined,
                  access_token: account.access_token as string | undefined,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token as string | undefined,
                  session_state: account.session_state as string | undefined,
                },
              })
            }

            // Auto-verify email for OAuth users (Google already verified the email)
            if (!dbUser.emailVerified) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { emailVerified: new Date() },
              })
            }

            // Update profile image if missing
            if (!dbUser.image && user.image) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { image: user.image },
              })
            }
          } else {
            // Create new user from OAuth
            dbUser = await prisma.user.create({
              data: {
                email,
                name: user.name || profile?.name || email.split('@')[0],
                image: user.image,
                emailVerified: new Date(), // OAuth = already verified
                role: 'USER',
                accounts: {
                  create: {
                    type: account.type,
                    provider: account.provider,
                    providerAccountId: account.providerAccountId,
                    refresh_token: account.refresh_token as string | undefined,
                    access_token: account.access_token as string | undefined,
                    expires_at: account.expires_at,
                    token_type: account.token_type,
                    scope: account.scope,
                    id_token: account.id_token as string | undefined,
                    session_state: account.session_state as string | undefined,
                  },
                },
              },
              include: { accounts: true },
            })

            // Send welcome email (fire-and-forget)
            const { emailService } = await import('@/lib/email')
            emailService.sendWelcomeEmail(email, dbUser.name || 'Bạn').catch(err =>
              console.error('❌ Failed to send welcome email:', err)
            )
          }

          // Inject dbUser id into the user object so JWT callback can use it
          user.id = dbUser.id
          user.role = dbUser.role
          user.createdAt = dbUser.createdAt.toISOString()
          
          return true
        } catch (error) {
          console.error('OAuth signIn error:', error)
          return false
        }
      }

      return true
    },

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
        token.sub = user.id
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



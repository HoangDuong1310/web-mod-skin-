import type { DefaultSession, DefaultUser } from 'next-auth'
import type { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      createdAt?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    createdAt?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string
    createdAt?: string
  }
}


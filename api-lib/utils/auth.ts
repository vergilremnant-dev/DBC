import { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
}

export function generateAccessToken(user: { id: string; email: string; role: string }): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is missing');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: '15m' } // 15 minutes Access Token
  );
}

export function verifyToken(req: VercelRequest): AuthenticatedUser | null {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthenticatedUser;
    return decoded;
  } catch {
    return null;
  }
}

export function hasRole(user: AuthenticatedUser, allowedRoles: ('CUSTOMER' | 'PROVIDER' | 'ADMIN')[]): boolean {
  return allowedRoles.includes(user.role);
}

export async function getTempUserId(): Promise<string> {
  const tempUserId = 'temp_unregistered';
  const { db } = await import('./db.js');
  let tempUser = await db.user.findUnique({ where: { id: tempUserId } });
  if (!tempUser) {
    tempUser = await db.user.create({
      data: {
        id: tempUserId,
        email: 'system_temp_otp@dbc.com',
        password: '$2a$10$UnregisteredSystemUserDummyHashForOTPStorageKey',
        role: 'CUSTOMER',
        status: 'ACTIVE',
      },
    });
  }
  return tempUser.id;
}

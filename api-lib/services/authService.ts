import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../utils/db.js';
import { Role } from '@prisma/client';
import { generateAccessToken } from '../utils/auth.js';
import { logSecurityEvent } from './auditService.js';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  role: string;
  status?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

interface DBUserForAuth {
  id: string;
  email: string;
  role: Role;
  status: string;
  customerProfile?: { fullName: string; phoneNumber: string | null } | null;
  providerProfile?: { fullName: string; phoneNumber: string | null } | null;
}

function mapUserToAuthUser(user: DBUserForAuth): AuthUser {
  let frontendRole = 'ROLE_CUSTOMER';
  let firstName = '';
  let lastName = '';
  let phone: string | null = null;

  switch (user.role) {
    case Role.ADMIN:
      frontendRole = 'ROLE_ADMIN';
      firstName = 'Admin';
      lastName = 'User';
      break;

    case Role.CUSTOMER:
      frontendRole = 'ROLE_CUSTOMER';
      if (user.customerProfile) {
        const parts = user.customerProfile.fullName.split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
        phone = user.customerProfile.phoneNumber;
      }
      break;

    case Role.PROVIDER:
      frontendRole = 'ROLE_PROVIDER';
      if (user.providerProfile) {
        const parts = user.providerProfile.fullName.split(' ');
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
        phone = user.providerProfile.phoneNumber;
      }
      break;
  }

  return {
    id: user.id,
    email: user.email,
    role: frontendRole,
    firstName,
    lastName,
    phone,
    status: user.status,
  };
}

export async function loginUser(
  input: LoginRequest,
  userAgent?: string,
  ipAddress?: string
): Promise<LoginResponse> {
  const { email, password } = input;

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const rawInput = email.trim();
  const digits = rawInput.replace(/\D/g, '');
  const isPhone = digits.length >= 10;

  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: rawInput },
        ...(isPhone
          ? [
              { email: `${digits}@dbc.com` },
              { customerProfile: { phoneNumber: { contains: digits } } },
              { providerProfile: { phoneNumber: { contains: digits } } },
            ]
          : []),
      ],
    },
    include: {
      customerProfile: true,
      providerProfile: true,
    },
  });

  if (!user) {
    throw new Error('Invalid email, phone number, or password');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Your account is currently inactive or suspended');
  }

  // Check failed attempts lockout policy (5 recent failures within 15 minutes)
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const failedAttempts = await db.globalActivity.count({
    where: {
      actorId: user.id,
      activityType: 'LOGIN',
      description: { contains: 'Failed login attempt' },
      createdAt: { gte: cutoff },
    },
  });

  if (failedAttempts >= 5) {
    // Suspend user account automatically
    await db.user.update({
      where: { id: user.id },
      data: { status: 'SUSPENDED' },
    });
    await logSecurityEvent(user.id, 'ADMIN_ACTION', 'User account auto-suspended due to repeated failed login attempts.');
    throw new Error('Your account is temporarily locked due to repeated failed login attempts. Please contact support.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    // Log failed attempt to track lockouts
    await logSecurityEvent(user.id, 'LOGIN', `Failed login attempt: invalid password from IP: ${ipAddress || 'unknown'}`);
    throw new Error('Invalid email or password');
  }

  // Log successful login security audit event
  await logSecurityEvent(user.id, 'LOGIN', `User successfully authenticated from IP: ${ipAddress || 'unknown'}`);

  // Generate short-lived access token (15 minutes)
  const accessToken = generateAccessToken(user);

  // Generate cryptographically secure long-lived refresh token (7 days)
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const hashedRefreshToken = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Store session in DB
  await db.userSession.create({
    data: {
      userId: user.id,
      token: hashedRefreshToken,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: mapUserToAuthUser(user),
  };
}

export async function refreshUserToken(
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<RefreshResponse> {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  const hashedToken = hashToken(refreshToken);

  // Look up session in DB
  const session = await db.userSession.findUnique({
    where: { token: hashedToken },
    include: {
      user: {
        include: {
          customerProfile: true,
          providerProfile: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error('Invalid or revoked session');
  }

  // Check expiration
  if (new Date() > session.expiresAt) {
    await db.userSession.delete({ where: { id: session.id } });
    throw new Error('Session expired');
  }

  // Rotate refresh token
  const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
  const newHashedRefreshToken = hashToken(newRawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Update session with rotated token
  await db.userSession.update({
    where: { id: session.id },
    data: {
      token: newHashedRefreshToken,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  // Generate new access token
  const accessToken = generateAccessToken(session.user);

  return {
    accessToken,
    refreshToken: newRawRefreshToken,
    user: mapUserToAuthUser(session.user),
  };
}

export async function logoutUserSession(refreshToken: string): Promise<void> {
  if (!refreshToken) return;
  const hashedToken = hashToken(refreshToken);
  try {
    const session = await db.userSession.findUnique({
      where: { token: hashedToken },
    });
    if (session) {
      await db.userSession.delete({
        where: { token: hashedToken },
      });
      await logSecurityEvent(session.userId, 'LOGOUT', 'User logged out of active session');
    }
  } catch {
    // If session doesn't exist, ignore
  }
}

export async function logoutAllUserSessions(userId: string): Promise<void> {
  await db.userSession.deleteMany({
    where: { userId },
  });
  await logSecurityEvent(userId, 'LOGOUT', 'User logged out of all active devices/sessions');
}

export async function getUserSessions(userId: string) {
  return await db.userSession.findMany({
    where: { userId },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function revokeUserSession(userId: string, sessionId: string): Promise<void> {
  const session = await db.userSession.findFirst({
    where: { id: sessionId, userId },
  });
  if (session) {
    await db.userSession.delete({
      where: { id: sessionId },
    });
  }
}

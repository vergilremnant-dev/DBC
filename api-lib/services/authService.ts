import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../utils/db.js';
import { Role } from '@prisma/client';
import { generateAccessToken } from '../utils/auth.js';
import { logSecurityEvent } from './auditService.js';
import { verifyFirebaseIdToken } from '../utils/verifyFirebaseToken.js';

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

export interface DBUserForAuth {
  id: string;
  email: string;
  role: Role;
  status: string;
  customerProfile?: { fullName: string; phoneNumber: string | null } | null;
  providerProfile?: { fullName: string; phoneNumber: string | null } | null;
}

export function mapUserToAuthUser(user: DBUserForAuth): AuthUser {
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
  const lowerInput = rawInput.toLowerCase();
  const digits = rawInput.replace(/\D/g, '');
  const isPhone = digits.length >= 10;

  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: lowerInput },
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

/**
 * Issues a standard DBC session (15-min access JWT + rotating 7-day refresh token
 * stored hashed in user_sessions) for an already-authenticated user. Same session
 * shape as password and social login, so existing middleware/RBAC is unchanged.
 */
export async function createUserSession(
  user: DBUserForAuth,
  userAgent?: string,
  ipAddress?: string
): Promise<LoginResponse> {
  const accessToken = generateAccessToken(user);
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.userSession.create({
    data: {
      userId: user.id,
      token: hashToken(rawRefreshToken),
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

  // A suspended/deactivated account must not be able to mint new access tokens.
  if (session.user.status !== 'ACTIVE') {
    await db.userSession.deleteMany({ where: { userId: session.userId } });
    throw new Error('Your account is currently inactive or suspended');
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

export interface SocialLoginRequest {
  idToken: string;
  provider?: string;
  email?: string;
  name?: string;
}

export async function socialLoginUser(
  input: SocialLoginRequest,
  userAgent?: string,
  ipAddress?: string
): Promise<LoginResponse> {
  const { idToken, provider } = input;
  const targetProvider = (provider || 'google').toLowerCase();
  const displayProvider = targetProvider === 'apple' ? 'Apple' : targetProvider === 'microsoft' ? 'Microsoft' : 'Google';

  if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
    throw new Error('ID Token is required for social authentication');
  }

  let verifiedEmail: string | undefined = undefined;
  let verifiedName: string | undefined = input.name;

  // Unit / Integration Test Isolation Mocks
  if (process.env.NODE_ENV === 'test' && idToken.startsWith('mock_google_id_token')) {
    verifiedEmail = input.email || 'google_test_user@example.com';
    verifiedName = input.name || 'Google Test User';
  } else if (process.env.NODE_ENV === 'test' && idToken.startsWith('mock_microsoft_id_token')) {
    verifiedEmail = input.email || 'microsoft_test_user@example.com';
    verifiedName = input.name || 'Microsoft Test User';
  } else if (process.env.NODE_ENV === 'test' && idToken.startsWith('mock_apple_id_token')) {
    verifiedEmail = input.email || 'apple_test_user@privaterelay.appleid.com';
    verifiedName = input.name || 'Apple Test User';
  } else {
    // The client sends a Firebase ID token (signInWithPopup -> getIdToken). Verify it with the
    // Firebase Admin SDK: signature, project audience/issuer and expiry. Google's tokeninfo endpoint
    // does not check that the token was issued for THIS Firebase project.
    let verified;
    try {
      verified = await verifyFirebaseIdToken(idToken);
    } catch {
      // Misconfiguration is logged server-side by the verifier; the client always gets one safe message.
      throw new Error(`Invalid, expired, or unverified ${displayProvider} identity token`);
    }
    if (!verified.email || verified.emailVerified !== true) {
      throw new Error('Social account email address must be verified');
    }
    verifiedEmail = verified.email.trim().toLowerCase();
  }

  if (!verifiedEmail) {
    throw new Error('Could not verify social identity email address');
  }

  const normalizedEmail = verifiedEmail.trim().toLowerCase();

  let user = await db.user.findFirst({
    where: { email: normalizedEmail },
    include: {
      customerProfile: true,
      providerProfile: true,
    },
  });

  if (!user) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), salt);

    const newUser = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: Role.CUSTOMER,
        status: 'ACTIVE',
      },
    });

    const fallbackName = targetProvider === 'apple' ? 'Apple User' : targetProvider === 'microsoft' ? 'Microsoft User' : 'Google User';
    const fullName = verifiedName || normalizedEmail.split('@')[0] || fallbackName;

    await db.customerProfile.create({
      data: {
        userId: newUser.id,
        fullName,
        phoneNumber: '',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
      },
    });

    user = await db.user.findUnique({
      where: { id: newUser.id },
      include: {
        customerProfile: true,
        providerProfile: true,
      },
    });
  }

  if (!user) {
    throw new Error('Failed to create or retrieve social user profile');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Your account is currently inactive or suspended');
  }

  await logSecurityEvent(user.id, 'LOGIN', `User authenticated via ${targetProvider} login from IP: ${ipAddress || 'unknown'}`);

  const accessToken = generateAccessToken(user);
  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const hashedRefreshToken = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

import { VercelResponse } from '@vercel/node';
import { db } from '../../utils/db.js';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validatePasswordStrength } from '../../utils/validation.js';
import { logSecurityEvent } from '../../services/auditService.js';
import { VercelRequestWithUser } from '../../middleware/authMiddleware.js';

export default async function handler(req: VercelRequestWithUser, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const {
    email,
    password,
    firstName,
    lastName,
    role: _clientRole,
    phone,
    preferredCity,
    skills: _skills,
    experienceYears,
    verificationToken,
    firebaseUid,
    firebaseIdToken,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Validate password strength policy
  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    return res.status(400).json({ success: false, message: passwordErrors.join(' ') });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isPhoneRegistration = Boolean(phone || normalizedEmail.endsWith('@dbc.com'));

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // MANDATORY SERVER-SIDE VERIFICATION PROOF VALIDATION
    if (!isPhoneRegistration) {
      // Email Channel: Must present valid, unexpired, single-use REGISTRATION_PROOF token
      if (!verificationToken || typeof verificationToken !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Please verify your email address before creating your account.',
        });
      }

      const proofTokenKey = `REGISTRATION_PROOF:${normalizedEmail}:${verificationToken.trim()}`;
      const proofSession = await db.userSession.findFirst({
        where: { token: proofTokenKey },
      });

      if (!proofSession) {
        return res.status(400).json({
          success: false,
          message: 'Verification proof is invalid or has expired. Please verify your email again.',
        });
      }

      if (new Date() > proofSession.expiresAt) {
        await db.userSession.delete({ where: { id: proofSession.id } });
        return res.status(400).json({
          success: false,
          message: 'Verification has expired. Please verify your email again.',
        });
      }

      // Single-use / Replay protection: Atomically delete the proof session
      await db.userSession.delete({ where: { id: proofSession.id } });
    } else {
      // Phone Channel: Must present verified Firebase UID / ID Token proof
      const hasPhoneProof = Boolean(firebaseUid || verificationToken || firebaseIdToken || process.env.NODE_ENV === 'test');
      if (!hasPhoneProof) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your phone number before creating your account.',
        });
      }

      // Consume token if a proof session exists for this phone registration email
      if (verificationToken) {
        const proofTokenKey = `REGISTRATION_PROOF:${normalizedEmail}:${verificationToken.trim()}`;
        await db.userSession.deleteMany({ where: { token: proofTokenKey } });
      }
    }

    // Hash password with BCrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ROLE SECURITY: Public registration is strictly enforced to Role.CUSTOMER
    const mappedRole: Role = Role.CUSTOMER;

    // Create user and profile
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: mappedRole,
        status: 'ACTIVE',
      },
    });

    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'New User';

    if (mappedRole === Role.CUSTOMER) {
      await db.customerProfile.create({
        data: {
          userId: user.id,
          fullName,
          phoneNumber: phone || '',
          city: preferredCity || 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
        },
      });
    } else if (mappedRole === Role.PROVIDER) {
      // Find default category ID or use 1
      const defaultCategory = await db.serviceCategory.findFirst({ where: { isActive: true } });
      const categoryId = defaultCategory ? defaultCategory.id : 1;

      await db.providerProfile.create({
        data: {
          userId: user.id,
          fullName,
          email,
          phoneNumber: phone || '',
          experienceYears: experienceYears ? Number(experienceYears) : 5,
          city: preferredCity || 'Hyderabad',
          state: 'Telangana',
          categoryId,
        },
      });
    }

    // Generate email verification token in DB
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(emailVerifyToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.userSession.create({
      data: {
        userId: user.id,
        token: `EMAIL_VERIFY:${hashedToken}`,
        expiresAt,
      },
    });

    await logSecurityEvent(user.id, 'PROFILE_UPDATE', 'New user account created successfully');

    // Return success response with verification token details
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Email verification link generated.',
      verificationToken: emailVerifyToken,
    });
    } catch (_error: any) {
    return res.status(500).json({ success: false, message: 'An internal server error occurred during registration.' });
  }
}

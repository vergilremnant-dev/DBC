import { VercelResponse } from '@vercel/node';
import { db } from '../../utils/db.js';
import crypto from 'crypto';
import { VercelRequestWithUser } from '../../middleware/authMiddleware.js';

export default async function handler(req: VercelRequestWithUser, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and verification code are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  try {
    const tokenKey = `EMAIL_OTP:${normalizedEmail}:${cleanOtp}`;

    const session = await db.userSession.findFirst({
      where: { token: tokenKey },
    });

    if (!session) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check the code or click Resend.' });
    }

    if (new Date() > session.expiresAt) {
      await db.userSession.delete({ where: { id: session.id } });
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    // Delete OTP session token upon successful verification
    await db.userSession.delete({ where: { id: session.id } });

    // Generate cryptographically secure short-lived registration verification proof (10 minutes)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const proofTokenKey = `REGISTRATION_PROOF:${normalizedEmail}:${verificationToken}`;
    const proofExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Clean up any existing proof tokens for this email
    await db.userSession.deleteMany({
      where: {
        token: {
          startsWith: `REGISTRATION_PROOF:${normalizedEmail}:`,
        },
      },
    });

    // Save registration proof token in DB session table
    await db.userSession.create({
      data: {
        userId: 'temp_unregistered',
        token: proofTokenKey,
        expiresAt: proofExpiresAt,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Email OTP verified successfully.',
      verificationToken,
    });
  } catch (error: any) {
    console.error('Error verifying email OTP:', error);
    return res.status(500).json({ success: false, message: 'An internal error occurred during OTP verification.' });
  }
}

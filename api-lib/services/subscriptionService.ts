import { db } from '../utils/db.js';
import { SubscriptionStatus, PaymentStatus, PaymentType } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export interface CreatePlanInput {
  name: string;
  price: number;
  durationDays: number;
  description?: string | null;
  features?: any;
}

export interface UpdatePlanInput {
  name?: string;
  price?: number;
  durationDays?: number;
  description?: string | null;
  features?: any;
  isActive?: boolean;
}

// Check and update expired subscriptions on-the-fly
export async function verifyActiveSubscription(userId: string): Promise<boolean> {
  const now = new Date();
  
  // Find all ACTIVE subscriptions for this user
  const activeSubs = await db.userSubscription.findMany({
    where: { userId, status: SubscriptionStatus.ACTIVE },
  });

  let hasActive = false;
  for (const sub of activeSubs) {
    if (sub.endDate < now) {
      // Auto-expire past subscription
      await db.userSubscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.EXPIRED },
      });
    } else {
      hasActive = true;
    }
  }

  return hasActive;
}

export async function getSubscriptionPlans(includeInactive = false) {
  return await db.subscriptionPlan.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { price: 'asc' },
  });
}

export async function getMySubscription(userId: string) {
  // First run check to update any expired ones
  await verifyActiveSubscription(userId);

  return await db.userSubscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function activateSubscription(userId: string, planId: number) {
  const plan = await db.subscriptionPlan.findUnique({
    where: { id: Number(planId) },
  });

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  if (!plan.isActive) {
    throw new Error('Selected plan is currently inactive');
  }

  // Enforce no duplicate active subscriptions
  const activeSubs = await db.userSubscription.findMany({
    where: { userId, status: SubscriptionStatus.ACTIVE },
  });
  const alreadyOnSamePlan = activeSubs.some((sub) => sub.planId === plan.id);
  if (alreadyOnSamePlan) {
    throw new Error('Forbidden: You already have an active subscription to this plan');
  }

  // Expire previous active subscriptions
  for (const sub of activeSubs) {
    await db.userSubscription.update({
      where: { id: sub.id },
      data: { status: SubscriptionStatus.EXPIRED },
    });
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + plan.durationDays);

  const transactionReference = `SUB-TX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return await db.userSubscription.create({
    data: {
      userId,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      transactionReference,
    },
    include: {
      plan: true,
    },
  });
}

export async function cancelSubscription(userId: string) {
  const activeSub = await db.userSubscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
    },
  });

  if (!activeSub) {
    throw new Error('No active subscription found to cancel');
  }

  return await db.userSubscription.update({
    where: { id: activeSub.id },
    data: {
      status: SubscriptionStatus.CANCELLED,
    },
    include: {
      plan: true,
    },
  });
}

// Admin Operations
export async function adminCreatePlan(input: CreatePlanInput) {
  if (!input.name || input.price === undefined || !input.durationDays) {
    throw new Error('Missing required plan parameters');
  }

  return await db.subscriptionPlan.create({
    data: {
      name: input.name,
      price: Number(input.price),
      durationDays: Number(input.durationDays),
      description: input.description,
      features: input.features || {},
      isActive: true,
    },
  });
}

export async function adminUpdatePlan(id: number, input: UpdatePlanInput) {
  const plan = await db.subscriptionPlan.findUnique({ where: { id: Number(id) } });
  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  return await db.subscriptionPlan.update({
    where: { id: Number(id) },
    data: {
      name: input.name,
      price: input.price !== undefined ? Number(input.price) : undefined,
      durationDays: input.durationDays !== undefined ? Number(input.durationDays) : undefined,
      description: input.description,
      features: input.features,
      isActive: input.isActive,
    },
  });
}

export async function adminDeletePlan(id: number) {
  const plan = await db.subscriptionPlan.findUnique({ where: { id: Number(id) } });
  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  // Perform soft delete by setting isActive to false
  return await db.subscriptionPlan.update({
    where: { id: Number(id) },
    data: { isActive: false },
  });
}

export async function createRazorpayOrder(userId: string, planId: number) {
  const plan = await db.subscriptionPlan.findUnique({
    where: { id: Number(planId) },
  });

  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  if (!plan.isActive) {
    throw new Error('Selected plan is currently inactive');
  }

  // Check if the user already has an active subscription to the same plan
  const activeSub = await db.userSubscription.findFirst({
    where: { userId, status: SubscriptionStatus.ACTIVE },
  });
  if (activeSub && activeSub.planId === plan.id) {
    throw new Error('You already have an active subscription to this plan');
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys are not configured in environment variables');
  }

  // Initialize Razorpay
  const RazorpayConstructor = (Razorpay as any).default || Razorpay;
  const razorpay = new RazorpayConstructor({
    key_id: keyId,
    key_secret: keySecret,
  });

  // Create order in Razorpay
  const amountInPaise = Math.round(plan.price * 100);
  const receipt = `sub_rcpt_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes: {
      userId,
      planId: String(plan.id),
    },
  });

  // Save the pending payment record in DB
  await db.payment.create({
    data: {
      userId,
      amount: plan.price,
      paymentType: PaymentType.SUBSCRIPTION,
      status: PaymentStatus.PENDING,
      txRef: order.id,
      razorpayOrderId: order.id,
      planId: plan.id,
    },
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
  };
}

export async function verifyRazorpayPayment(
  userId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new Error('Razorpay API keys are not configured');
  }

  // 1. Verify signature using timing-safe comparison
  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const generatedSignature = hmac.digest('hex');

  let isValidSignature = false;
  try {
    const generatedBuf = Buffer.from(generatedSignature, 'utf-8');
    const signatureBuf = Buffer.from(razorpaySignature, 'utf-8');
    if (generatedBuf.length === signatureBuf.length) {
      isValidSignature = crypto.timingSafeEqual(generatedBuf, signatureBuf);
    }
  } catch {
    isValidSignature = false;
  }

  if (!isValidSignature) {
    // Update the payment record to FAILED
    try {
      // Scope to the caller: a bad signature must not let one user fail another user's payment.
      const p = await db.payment.findFirst({
        where: { userId, OR: [{ txRef: razorpayOrderId }, { razorpayOrderId }] },
      });
      if (p) {
        await db.payment.update({
          where: { id: p.id },
          data: { status: PaymentStatus.FAILED },
        });
      }
    } catch {
      // Ignore if payment record doesn't exist
    }
    throw new Error('Payment signature verification failed');
  }

  // 2. Fetch corresponding payment record and update atomically within a transaction
  return await db.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: { OR: [{ txRef: razorpayOrderId }, { razorpayOrderId }] },
      include: { plan: true },
    });

    if (!payment) {
      throw new Error('Payment record not found for this order');
    }

    if (payment.userId !== userId) {
      throw new Error('Payment does not belong to this user');
    }

    // Idempotency: If payment is already successful, do not activate again
    if (payment.status === PaymentStatus.SUCCESS) {
      const existingSub = await tx.userSubscription.findFirst({
        where: { userId, transactionReference: razorpayPaymentId },
        include: { plan: true },
      });
      if (existingSub) {
        return existingSub;
      }
    }

    const plan = payment.plan;
    if (!plan) {
      throw new Error('Plan not associated with this payment');
    }

    // Enforce no duplicate active subscriptions. Check and expire.
    await tx.userSubscription.updateMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.EXPIRED },
    });

    // Create User Subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    const subscription = await tx.userSubscription.create({
      data: {
        userId,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        transactionReference: razorpayPaymentId,
      },
      include: {
        plan: true,
      },
    });

    // Update payment status to SUCCESS and store payment details
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.SUCCESS,
        razorpayPaymentId,
        razorpaySignature,
      },
    });

    return subscription;
  });
}


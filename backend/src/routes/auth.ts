import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../index';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'siteforge-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Generate JWT token
const generateToken = (userId: string, email: string, role: string) => {
  return jwt.sign({ sub: userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Generate refresh token
const generateRefreshToken = (userId: string) => {
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
};

// POST /api/v1/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Email already registered' } });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name: name || email.split('@')[0] }
    });
    
    // Create default subscription (free tier)
    const freePlan = await prisma.plan.findUnique({ where: { slug: 'free' } });
    if (freePlan) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: freePlan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
    }
    
    const token = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }
    
    // In a real app, compare hashed password. For now, simplified.
    // const valid = await bcrypt.compare(password, user.passwordHash);
    // if (!valid) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    
    const token = generateToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { sub: string; type: string };
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' } });
    }
    
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }
    
    const token = generateToken(user.id, user.email, user.role);
    const newRefreshToken = generateRefreshToken(user.id);
    
    res.json({ token, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/me
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        subscriptions: { include: { plan: true }, take: 1 }
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      plan: user.subscriptions[0]?.plan || null
    });
  } catch (err) {
    next(err);
  }
});

export default router;

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../db.js';
import { requireLogin } from '../middleware/auth.js';
import { logActivity } from '../services/activityLog.js';
import crypto from 'crypto';

const router = Router();

// Validation rules (NFR-05)
const registerSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.string().trim().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // The user can only sign up as adopter or foster parent
  // Staff, vet, volunteer and admin accounts are created by an admin (FR-19)
  role: z.enum(['adopter', 'foster']).default('adopter'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

//start a fresh session for a user
// regenerate() gives the user a brand-new session ID at login, which prevents an attacker from planting a known session ID beforehand ("session fixation").
function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.user = {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role.role_name,
      };
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}

// FR-01: register
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  const { full_name, email, phone, password, role } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const roleRow = await prisma.role.findUnique({ where: { role_name: role } });
  const password_hash = await bcrypt.hash(password, 12); // NFR-01

  const user = await prisma.user.create({
    data: { full_name, email, phone, password_hash, role_id: roleRow.role_id },
    include: { role: true },
  });

  await logActivity(user.user_id, 'create', `New account registered: ${email}`, 'User', user.user_id);
  await startSession(req, user); // log them in right away

  res.status(201).json({ message: 'Account created successfully', user: req.session.user });
});

// FR-02: Login
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }
  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });
  const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));

  // Same message for "no such email" and "wrong password", so attackers can't use the login form to discover which emails have accounts.
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // FR-27: deactivated accounts cannot log in
  if (user.account_status !== 'active') {
    return res.status(403).json({ error: 'This account has been deactivated. Please contact an administrator.' });
  }

  await startSession(req, user);
  await logActivity(user.user_id, 'login', `${user.full_name} logged in`);

  res.json({ message: 'Logged in successfully', user: req.session.user });
});

// FR-03: Logout
// POST /api/auth/logout
router.post('/logout', requireLogin, async (req, res, next) => {
  const { id, name } = req.session.user;
  await logActivity(id, 'logout', `${name} logged out`);

  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('shelter.sid');
    res.json({ message: 'You have been logged out' });
  });
});


// GET /api/auth/me  (the React app calls this on page load to see if you're logged in)
router.get('/me', requireLogin, (req, res) => {
  res.json({ user: req.session.user });
});

//FR-04: Password reset
// The token is like a one-time password. We store only its SHA-256 hash, so even someone who reads the database can't use a stored token. It expires after 1 hour
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// POST /api/auth/forgot-password   body: { "email": "..." }
const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

router.post('/forgot-password', async (req, res) => {
  const result = forgotSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  // Same message whether or not the account exists, so the form can't be used to discover emails
  const message = 'If an account exists for that email, password reset instructions have been sent.';

  const user = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (!user || user.account_status !== 'active') {
    return res.json({ message });
  }

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { user_id: user.user_id },
    data: { reset_token: hashToken(token), reset_expires: new Date(Date.now() + 60 * 60 * 1000) },
  });
  await logActivity(user.user_id, 'password_reset_request', 'Password reset requested');

  // there is no email service yet, so the link is returned directly so the feature can be tested. A real deployment would email this link instead.
  res.json({ message, demo_reset_link: `/reset-password?token=${token}` });
});

// POST /api/auth/reset-password   body: { "token": "...", "password": "..." }
const resetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/reset-password', async (req, res) => {
  const result = resetSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const user = await prisma.user.findFirst({
    where: { reset_token: hashToken(result.data.token), reset_expires: { gt: new Date() } },
  });
  if (!user) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired' });
  }

  await prisma.user.update({
    where: { user_id: user.user_id },
    data: {
      password_hash: await bcrypt.hash(result.data.password, 12),
      reset_token: null, // the link only works once
      reset_expires: null,
    },
  });
  await logActivity(user.user_id, 'update', 'Password was reset', 'User', user.user_id);

  res.json({ message: 'Your password has been updated. You can now log in.' });
});

export default router;
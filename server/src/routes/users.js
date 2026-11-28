import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { validate, parseId, httpError } from '../middleware/validate.js';
import { logActivity } from '../services/activityLog.js';

const router = Router();

// Every route in this file is admin-only (FR-05, FR-19, FR-27, NFR-08)
router.use(requireRole('admin'));

const ROLES = ['admin', 'staff', 'vet', 'volunteer', 'adopter', 'foster'];

// Never send password hashes or reset tokens to the browser (NFR-08)
const safeUserFields = {
  user_id: true,
  full_name: true,
  email: true,
  phone: true,
  account_status: true,
  created_at: true,
  role: { select: { role_id: true, role_name: true } },
};

// List roles (for the role dropdown)
// GET /api/users/roles
router.get('/roles', async (req, res) => {
  const roles = await prisma.role.findMany({ orderBy: { role_id: 'asc' } });
  res.json({ roles });
});

// List users, with optional filters
// GET /api/users?role=volunteer&status=active&search=smith
router.get('/', async (req, res) => {
  const { role, status, search } = req.query;
  const where = {};
  if (role) where.role = { role_name: String(role) };
  if (status) where.account_status = String(status);
  if (search) {
    where.OR = [
      { full_name: { contains: String(search) } },
      { email: { contains: String(search) } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: safeUserFields,
    orderBy: { full_name: 'asc' },
  });
  res.json({ users });
});

// FR-19: Create a staff, vet, volunteer (or any) account
// POST /api/users
const createUserSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.string().trim().optional(),
  role: z.enum(ROLES, { message: `Role must be one of: ${ROLES.join(', ')}` }),
});

router.post('/', validate(createUserSchema), async (req, res) => {
  const { full_name, email, phone, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw httpError(409, 'An account with this email already exists');

  const roleRow = await prisma.role.findUnique({ where: { role_name: role } });

  // Random temporary password, shown to the admin once so they can give it to the new user
  const temporaryPassword = crypto.randomBytes(6).toString('base64url');
  const password_hash = await bcrypt.hash(temporaryPassword, 12);

  // Transaction (NFR-09): the user and their volunteer profile are created together
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { full_name, email, phone, password_hash, role_id: roleRow.role_id },
      select: safeUserFields,
    });
    if (role === 'volunteer') {
      await tx.volunteerProfile.create({ data: { user_id: newUser.user_id } });
    }
    return newUser;
  });

  await logActivity(req.session.user.id, 'create', `Created ${role} account for ${email}`, 'User', user.user_id);

  res.status(201).json({
    message: 'Account created. Share the temporary password with the new user.',
    user,
    temporaryPassword,
  });
});

// FR-05: Change a user's role
// PATCH /api/users/:id/role   body: { "role": "staff" }
const roleSchema = z.object({
  role: z.enum(ROLES, { message: `Role must be one of: ${ROLES.join(', ')}` }),
});

router.patch('/:id/role', validate(roleSchema), async (req, res) => {
  const userId = parseId(req.params.id);
  if (userId === req.session.user.id) {
    throw httpError(400, 'You cannot change your own role');
  }

  const roleRow = await prisma.role.findUnique({ where: { role_name: req.body.role } });
  const user = await prisma.user.update({
    where: { user_id: userId },
    data: { role_id: roleRow.role_id },
    select: safeUserFields,
  });

  await logActivity(req.session.user.id, 'update', `Changed role of ${user.email} to ${req.body.role}`, 'User', userId);
  res.json({ message: 'Role updated', user });
});

// FR-27: Deactivate or reactivate an account
// PATCH /api/users/:id/status   body: { "account_status": "inactive" }
const statusSchema = z.object({
  account_status: z.enum(['active', 'inactive'], { message: 'Status must be active or inactive' }),
});

router.patch('/:id/status', validate(statusSchema), async (req, res) => {
  const userId = parseId(req.params.id);
  if (userId === req.session.user.id) {
    throw httpError(400, 'You cannot deactivate your own account');
  }

  // Soft delete: the row stays, so all their history (applications, records, logs) is preserved
  const user = await prisma.user.update({
    where: { user_id: userId },
    data: { account_status: req.body.account_status },
    select: safeUserFields,
  });

  const action = req.body.account_status === 'inactive' ? 'Deactivated' : 'Reactivated';
  await logActivity(req.session.user.id, 'update', `${action} account ${user.email}`, 'User', userId);
  res.json({ message: `Account ${action.toLowerCase()}`, user });
});

export default router;
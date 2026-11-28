import { Router } from 'express';
import prisma from '../db.js';
import { requireRole } from '../middleware/auth.js';
import { parseDate, parseId } from '../middleware/validate.js';

const router = Router();

router.use(requireRole('admin'));

// FR-28: View activity logs with filters
// GET /api/logs?from=2026-11-01&to=2026-11-30&user_id=2&action_type=login
router.get('/', async (req, res) => {
  const { from, to, user_id, action_type } = req.query;
  const where = {};

  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = parseDate(from); // gte = greater than or equal
    if (to) where.created_at.lte = parseDate(to, true); // lte = less than or equal
  }
  if (user_id) where.user_id = parseId(user_id);
  if (action_type) where.action_type = String(action_type);

  const logs = await prisma.activityLog.findMany({
    where,
    include: { user: { select: { full_name: true, email: true } } },
    orderBy: { created_at: 'desc' },
    take: 200, // newest 200 entries, keeps the page fast (NFR-04)
  });
  res.json({ logs });
});

export default router;
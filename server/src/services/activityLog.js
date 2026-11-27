import prisma from '../db.js';

// Records an important action in the ActivityLogs table (FR-28, NFR-11).
//if logging fails, the user's actual action still succeeds (NFR-14).
export async function logActivity(userId, actionType, description, entityType = null, entityId = null) {
  try {
    await prisma.activityLog.create({
      data: {
        user_id: userId,
        action_type: actionType,
        description,
        entity_type: entityType,
        entity_id: entityId,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}
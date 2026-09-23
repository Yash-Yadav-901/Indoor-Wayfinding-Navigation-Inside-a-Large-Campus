import express from 'express'
import {
  closeEdge,
  reopenEdge,
  setEdgeCongestion,
  setEdgeAccessibility,
  getCampusAnalytics,
} from '../controllers/admin.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)
router.use(requireAdmin)

router.get('/analytics', getCampusAnalytics)
router.patch('/edges/:id/close', closeEdge)
router.patch('/edges/:id/reopen', reopenEdge)
router.patch('/edges/:id/congestion', setEdgeCongestion)
router.patch('/edges/:id/accessibility', setEdgeAccessibility)

export default router

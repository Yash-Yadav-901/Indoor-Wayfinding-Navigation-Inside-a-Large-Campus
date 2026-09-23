import express from 'express'
import {
  listPois,
  getNearestPoi,
  addPoi,
  removePoi
} from '../controllers/poi.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', listPois)
router.get('/nearest', getNearestPoi)
router.post('/', requireAdmin, addPoi)
router.delete('/:id', requireAdmin, removePoi)

export default router

import express from 'express'
import {
  listEdges,
  getEdge,
  addEdge,
  editEdge,
  removeEdge
} from '../controllers/edges.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', listEdges)
router.get('/:id', getEdge)
router.post('/', requireAdmin, addEdge)
router.put('/:id', requireAdmin, editEdge)
router.delete('/:id', requireAdmin, removeEdge)

export default router

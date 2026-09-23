import express from 'express'
import {
  listNodes,
  getNode,
  addNode,
  editNode,
  removeNode,
} from '../controllers/nodes.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', listNodes)
router.get('/:id', getNode)
router.post('/', requireAdmin, addNode)
router.put('/:id', requireAdmin, editNode)
router.delete('/:id', requireAdmin, removeNode)

export default router

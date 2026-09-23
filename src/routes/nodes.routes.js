
import express from 'express'
import {
  listNodes,
  getNode,
  addNode,
  editNode,
  removeNode
} from '../controllers/nodes.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(requireAuth) // protect all node routes

router.get('/nodes', listNodes)
router.get('/nodes/:id', getNode)
router.post('/nodes', addNode)
router.put('/nodes/:id', editNode)
router.delete('/nodes/:id', removeNode)

export default router


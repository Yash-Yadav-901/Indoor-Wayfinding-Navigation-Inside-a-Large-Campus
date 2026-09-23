import express from 'express'
import { getRoute } from '../controllers/route.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', getRoute)

export default router

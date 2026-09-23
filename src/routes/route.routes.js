import express from 'express'
import {
  getRoute,
  getNearestPoiRoute,
  getMultiStopRoute,
} from '../controllers/route.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', getRoute)
router.get('/nearest-poi', getNearestPoiRoute)
router.post('/multi-stop', getMultiStopRoute)

export default router

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import 'dotenv/config'

import authRoutes from './routes/auth.routes.js'
import nodeRoutes from './routes/nodes.routes.js'
import edgeRoutes from './routes/edges.routes.js'
import poiRoutes from './routes/poi.routes.js'
import routeRoutes from './routes/route.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { errorHandler } from './middleware/error.middleware.js'

const app = express()

app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})
app.get('/', (req, res) => {
    res.json({ status: 'indoor wayfinding navigation system is running try some of the apis endpoints to find routes to destination', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/nodes', nodeRoutes)
app.use('/api/edges', edgeRoutes)
app.use('/api/poi', poiRoutes)
app.use('/api/route', routeRoutes)
app.use('/api/admin', adminRoutes)

app.use(errorHandler)

export default app

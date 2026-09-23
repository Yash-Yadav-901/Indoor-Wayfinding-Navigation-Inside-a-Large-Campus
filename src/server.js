import 'dotenv/config'
import app from './app.js'

const PORT = process.env.PORT || 5000

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION — shutting down...')
  console.error(err.name, err.message)
  process.exit(1)
})

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
})

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION — shutting down...')
  console.error(err.name, err.message)
  server.close(() => {
    process.exit(1)
  })
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received — closing server gracefully...')
  server.close(() => {
    console.log('Process terminated')
  })
})

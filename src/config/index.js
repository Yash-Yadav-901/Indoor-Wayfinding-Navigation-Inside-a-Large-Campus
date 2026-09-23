import 'dotenv/config'

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  logLevel: process.env.LOG_LEVEL || 'info',
  cache: {
    routeTTL: 60 * 60,
    graphTTL: 60 * 10,
  },
}

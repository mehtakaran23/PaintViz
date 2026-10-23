import cors from 'cors'
import express from 'express'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'
import authRouter from './routes/auth.routes.js'
import designRouter from './routes/design.routes.js'
import healthRouter from './routes/health.routes.js'

async function startServer() {
  try {
    await connectDatabase()
    console.log('Connected to MongoDB')

    const app = express()

    app.use(cors())
    app.use(express.json())
    app.use('/api/health', healthRouter)
    app.use('/api/auth', authRouter)
    app.use('/api/designs', designRouter)

    app.use((error, _request, response, _next) => {
      const statusCode =
        Number.isInteger(error.statusCode)
          ? error.statusCode
          : error.name === 'ValidationError' || error.name === 'CastError'
            ? 400
            : error.code === 11000
              ? 409
              : 500
      if (statusCode >= 500) {
        console.error('Unhandled server error:', error.message)
      }
      response.status(statusCode).json({
        message:
          statusCode >= 500
            ? 'Something went wrong'
            : error.code === 11000
              ? 'A design with these details already exists'
              : error.message,
      })
    })

    app.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`)
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error'
    console.error(`Unable to start server: ${message}`)
    process.exit(1)
  }
}

startServer()

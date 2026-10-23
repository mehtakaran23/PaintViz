import cors from 'cors'
import express from 'express'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'
import authRouter from './routes/auth.routes.js'
import designRouter from './routes/design.routes.js'
import healthRouter from './routes/health.routes.js'
import paintColorRouter from './routes/paint-color.routes.js'
import { ImageUploadValidationError } from './middleware/image-upload.middleware.js'
import multer from 'multer'

async function startServer() {
  try {
    await connectDatabase()
    console.log('Connected to MongoDB')

    const app = express()

    app.use(cors())
    app.use(express.json({ limit: '2mb' }))
    app.use('/api/health', healthRouter)
    app.use('/api/auth', authRouter)
    app.use('/api/colours', paintColorRouter)
    app.use('/api/designs', designRouter)

    app.use((error, _request, response, _next) => {
      const isJsonBodyTooLarge = error.type === 'entity.too.large'
      const statusCode =
        Number.isInteger(error.statusCode)
          ? error.statusCode
          : isJsonBodyTooLarge
            ? 413
          : error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
            ? 413
            : error instanceof multer.MulterError
              ? 400
            : error instanceof ImageUploadValidationError
              ? 400
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
            : isJsonBodyTooLarge
              ? 'Request body is too large'
            : statusCode === 413
              ? 'Image must be 12 MB or smaller'
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

import { v2 as cloudinary } from 'cloudinary'
import { randomUUID } from 'node:crypto'
import { ImageUploadValidationError } from '../middleware/image-upload.middleware.js'

const assetTypes = new Set(['original', 'processed'])

function cloudinaryConfiguration() {
  const configuration = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
    api_key: process.env.CLOUDINARY_API_KEY?.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  }

  if (Object.values(configuration).some((value) => !value)) {
    const error = new Error('Image storage is not configured. Set the Cloudinary environment variables.')
    error.statusCode = 503
    throw error
  }

  return configuration
}

export async function uploadImageBuffer(userId, file, assetType) {
  if (!file) throw new ImageUploadValidationError('An image file is required.')
  if (!assetTypes.has(assetType)) {
    throw new ImageUploadValidationError('assetType must be original or processed.')
  }

  const configuration = cloudinaryConfiguration()
  cloudinary.config(configuration)

  const folder = `paintviz/users/${String(userId)}/design-assets`
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${assetType}-${randomUUID()}`,
        resource_type: 'image',
        overwrite: false,
        invalidate: false,
      },
      (error, result) => {
        if (error || !result?.secure_url || !result.public_id) {
          const uploadError = new Error('Image upload failed. Please try again.')
          uploadError.statusCode = 502
          reject(uploadError)
          return
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )

    upload.end(file.buffer)
  })
}

import multer from 'multer'

export class ImageUploadValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ImageUploadValidationError'
    this.statusCode = 400
  }
}

const acceptedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!acceptedMimeTypes.has(file.mimetype)) {
      callback(new ImageUploadValidationError('Only JPEG, PNG, and WebP images are supported.'))
      return
    }
    callback(null, true)
  },
})

export function validateImageBytes(file) {
  const bytes = file?.buffer
  const isJpeg = bytes?.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng = bytes?.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  const isWebp = bytes?.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'

  if (!isJpeg && !isPng && !isWebp) {
    throw new ImageUploadValidationError('The uploaded file is not a valid JPEG, PNG, or WebP image.')
  }
  const detectedMimeType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp'
  if (file.mimetype !== detectedMimeType) {
    throw new ImageUploadValidationError('The file type does not match its image contents.')
  }
}

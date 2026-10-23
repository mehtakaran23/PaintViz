import multer from 'multer'

export class ImageUploadValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ImageUploadValidationError'
    this.statusCode = 400
  }
}

const acceptedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_DIMENSION = 8000
const MAX_IMAGE_PIXELS = 25_000_000

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

  const dimensions = getImageDimensions(bytes, detectedMimeType)
  if (!dimensions) {
    throw new ImageUploadValidationError('The uploaded image dimensions could not be verified.')
  }
  if (
    dimensions.width > MAX_IMAGE_DIMENSION ||
    dimensions.height > MAX_IMAGE_DIMENSION ||
    dimensions.width * dimensions.height > MAX_IMAGE_PIXELS
  ) {
    throw new ImageUploadValidationError('Images must be no larger than 8000px per side and 25 megapixels.')
  }
}

function getImageDimensions(bytes, mimeType) {
  if (mimeType === 'image/png' && bytes.length >= 24) {
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    }
  }

  if (mimeType === 'image/webp' && bytes.length >= 30) {
    const chunkType = bytes.toString('ascii', 12, 16)
    if (chunkType === 'VP8X' && bytes.length >= 30) {
      return {
        width: 1 + bytes.readUIntLE(24, 3),
        height: 1 + bytes.readUIntLE(27, 3),
      }
    }
    if (chunkType === 'VP8L' && bytes.length >= 25) {
      return {
        width: 1 + (((bytes[21] & 0x3f) << 8) | bytes[20]),
        height: 1 + (((bytes[23] & 0xf) << 10) | (bytes[22] << 2) | ((bytes[21] & 0xc0) >> 6)),
      }
    }
    if (chunkType === 'VP8 ' && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
      return {
        width: bytes.readUInt16LE(26) & 0x3fff,
        height: bytes.readUInt16LE(28) & 0x3fff,
      }
    }
    return null
  }

  if (mimeType === 'image/jpeg') {
    let offset = 2
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1
        continue
      }
      const marker = bytes[offset + 1]
      offset += 2
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue
      if (offset + 2 > bytes.length) return null
      const segmentLength = bytes.readUInt16BE(offset)
      if (segmentLength < 2 || offset + segmentLength > bytes.length) return null
      const isStartOfFrame = (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      if (isStartOfFrame && segmentLength >= 7) {
        return {
          height: bytes.readUInt16BE(offset + 3),
          width: bytes.readUInt16BE(offset + 5),
        }
      }
      offset += segmentLength
    }
  }

  return null
}

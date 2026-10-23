import { Router } from 'express'
import { create, list, read, remove, update, uploadImage } from '../controllers/design.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { imageUpload } from '../middleware/image-upload.middleware.js'

const designRouter = Router()

designRouter.use(requireAuth)
designRouter.post('/assets', imageUpload.single('image'), uploadImage)
designRouter.post('/', create)
designRouter.get('/', list)
designRouter.get('/:id', read)
designRouter.patch('/:id', update)
designRouter.delete('/:id', remove)

export default designRouter

import { Router } from 'express'
import { create, list, read, remove, update } from '../controllers/design.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const designRouter = Router()

designRouter.use(requireAuth)
designRouter.post('/', create)
designRouter.get('/', list)
designRouter.get('/:id', read)
designRouter.patch('/:id', update)
designRouter.delete('/:id', remove)

export default designRouter

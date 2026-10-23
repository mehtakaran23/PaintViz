import { Router } from 'express'
import { categories, list } from '../controllers/paint-color.controller.js'

const paintColorRouter = Router()
paintColorRouter.get('/', list)
paintColorRouter.get('/categories', categories)

export default paintColorRouter

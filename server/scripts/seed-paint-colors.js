import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/db.js'
import PaintColor from '../src/models/PaintColor.js'
import { paintCatalogue } from '../../client/src/data/paintCatalogue.js'

await connectDatabase()

const operations = paintCatalogue.map((color) => ({
  updateOne: {
    filter: { catalogueId: color.id },
    update: {
      $set: {
        catalogueId: color.id,
        name: color.name,
        hexCode: color.hex,
        category: color.category,
        isActive: true,
      },
      $setOnInsert: { description: 'PaintViz curated preview colour; not an official manufacturer code.' },
    },
    upsert: true,
  },
}))

const result = await PaintColor.bulkWrite(operations, { ordered: false })
console.log(`Paint catalogue seed complete: ${result.upsertedCount} inserted, ${result.modifiedCount} updated.`)
await mongoose.disconnect()

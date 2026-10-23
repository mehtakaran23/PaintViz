import mongoose from 'mongoose'

const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const paintColorSchema = new mongoose.Schema(
  {
    catalogueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    hexCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: hexColorPattern,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

const PaintColor =
  mongoose.models.PaintColor ||
  mongoose.model('PaintColor', paintColorSchema)

export default PaintColor

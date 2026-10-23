import mongoose from 'mongoose'

const selectedColorSchema = new mongoose.Schema(
  {
    colorId: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    paintColor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaintColor',
    },
    hexCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
    },
  },
  {
    _id: false,
    validate: {
      validator: (value) => Boolean(value.colorId || value.paintColor),
      message: 'A selected colour must include a colour ID or PaintColor reference',
    },
  },
)

const pointSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true, min: 0, max: 1 },
    y: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false },
)

const wallSelectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['polygon', 'brush'],
      required: true,
    },
    points: {
      type: [pointSchema],
      required: true,
      validate: [
        {
          validator: (points) => points.length >= 2 && points.length <= 1000,
          message: 'A wall selection must contain between 2 and 1000 points',
        },
        {
          validator: function validatePointCount(points) {
            return this.type !== 'polygon' || points.length >= 3
          },
          message: 'A polygon selection must contain at least 3 points',
        },
      ],
    },
    regionId: { type: String, trim: true, maxlength: 100 },
    name: { type: String, trim: true, maxlength: 80 },
    color: {
      type: String,
      uppercase: true,
      trim: true,
      match: /^#[0-9A-F]{6}$/,
    },
    mode: { type: String, enum: ['brush', 'eraser'] },
    size: { type: Number, min: 0.0001, max: 1 },
  },
  { _id: false, strict: true },
)

const designSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    originalImageUrl: {
      type: String,
      required: true,
      trim: true,
    },
    processedImageUrl: {
      type: String,
      trim: true,
    },
    originalImagePublicId: {
      type: String,
      trim: true,
      maxlength: 300,
      match: /^[A-Za-z0-9][A-Za-z0-9/_-]{0,299}$/,
    },
    processedImagePublicId: {
      type: String,
      trim: true,
      maxlength: 300,
      match: /^[A-Za-z0-9][A-Za-z0-9/_-]{0,299}$/,
    },
    selectedColors: {
      type: [selectedColorSchema],
      default: [],
    },
    wallSelections: {
      type: [wallSelectionSchema],
      default: [],
      validate: {
        validator: (selections) => selections.length <= 100,
        message: 'A design cannot contain more than 100 wall selections',
      },
    },
    editorSettings: {
      blendStrength: {
        type: Number,
        min: 0,
        max: 100,
        default: 48,
      },
      tool: {
        type: String,
        maxlength: 30,
        default: 'polygon',
      },
      brushSize: {
        type: Number,
        min: 1,
        max: 200,
        default: 28,
      },
    },
  },
  { timestamps: true },
)

designSchema.index({ user: 1, updatedAt: -1 })

const Design = mongoose.models.Design || mongoose.model('Design', designSchema)

export default Design

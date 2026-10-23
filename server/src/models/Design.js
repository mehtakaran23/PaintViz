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
      type: [mongoose.Schema.Types.Mixed],
      default: [],
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

const Design = mongoose.models.Design || mongoose.model('Design', designSchema)

export default Design

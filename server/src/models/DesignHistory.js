import mongoose from 'mongoose'

const designHistorySchema = new mongoose.Schema(
  {
    design: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Design',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

designHistorySchema.index({ design: 1, user: 1, createdAt: -1 })

const DesignHistory =
  mongoose.models.DesignHistory ||
  mongoose.model('DesignHistory', designHistorySchema)

export default DesignHistory

import mongoose from 'mongoose'

const spinFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  json_content: {
    type: Array,
    required: true,
    default: []
  },
  picture: {
    type: String, // Base64 encoded image
    default: null
  },
  ticketNumber: {
    type: String,
    default: ''
  },
  active: {
    type: Boolean,
    default: true
  },
  fixedWinnerTicket: {
    type: String,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
})

const SpinFile = mongoose.model('SpinFile', spinFileSchema)

export default SpinFile


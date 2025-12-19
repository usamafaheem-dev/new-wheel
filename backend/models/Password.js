import mongoose from 'mongoose'

const passwordSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true
  }
}, {
  timestamps: true
})

// Only one password document should exist
passwordSchema.statics.getPassword = async function() {
  let password = await this.findOne()
  if (!password) {
    // Create default password hash for "admin"
    const bcrypt = await import('bcryptjs')
    const defaultHash = bcrypt.default.hashSync('admin', 10)
    password = await this.create({ hash: defaultHash })
  }
  return password
}

passwordSchema.statics.updatePassword = async function(newHash) {
  let password = await this.findOne()
  if (password) {
    password.hash = newHash
    await password.save()
  } else {
    password = await this.create({ hash: newHash })
  }
  return password
}

const Password = mongoose.model('Password', passwordSchema)

export default Password


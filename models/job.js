const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: Number, required: true },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model created by Member 2
    required: true
  },
  company: { type: String, required: true },
  requirements: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
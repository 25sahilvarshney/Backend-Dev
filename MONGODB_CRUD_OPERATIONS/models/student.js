const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  email: String,
  age: Number,
  gpa: Number,
  courses: [String],
  lowestGPA: Number,
  highestGPA: Number,
  temporaryField: String,
  oldFieldName: String,
});

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);

const mongoose = require('mongoose');
const Student = require('../models/student');

const createStudent = async (studentData) => {
  try {
    const student = new Student({
      _id: new mongoose.Types.ObjectId(),
      ...studentData,
    });

    const savedStudent = await student.save();
    console.log(' Read Student:', savedStudent);
    return savedStudent;
  } catch (error) {
    console.error('Error creating student:', error.message);
    throw error;
  }
};

module.exports = createStudent;

const Student = require('../models/student');


const updateOperatorsExample = async (studentId) => {
  try {
    await Student.findByIdAndUpdate(
      studentId,
      { $set: { email: 'newemail@university.edu' } }
    );

    await Student.findByIdAndUpdate(
      studentId,
      { $inc: { age: 1 } }
    );

    await Student.findByIdAndUpdate(
      studentId,
      { $push: { courses: 'CS404' } }
    );

    await Student.findByIdAndUpdate(
      studentId,
      { $addToSet: { courses: 'MATH401' } }
    );

    await Student.findByIdAndUpdate(
      studentId,
      { $pull: { courses: 'CS101' } }
    );

    await Student.findByIdAndUpdate(
      studentId,
      { $pop: { courses: 1 } }
    );

    await Student.findByIdAndUpdate(
      studentId,
      { $unset: { temporaryField: '' } }
    );

    await Student.updateMany(
      {},
      { $rename: { oldFieldName: 'newFieldName' } }
    );

    await Student.findByIdAndUpdate(
      studentId,
      { $min: { lowestGPA: 3.0 } }
    );

    await Student.findByIdAndUpdate(
      studentId,
      { $max: { highestGPA: 4.0 } }
    );

    console.log('Update operations completed');
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};


const updateStudent = async (email, updates) => {
  try {
    const result = await Student.updateOne(
      { email },
      { $set: updates }
    );
    console.log('Match count:', result.matchedCount);
    console.log('Modified count:', result.modifiedCount);
    return result;
  } catch (error) {
    console.error('Error updating student:', error.message);
    throw error;
  }
};


const updateStudentById = async (id, updates) => {
  try {
    const student = await Student.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!student) {
      throw new Error('Student not found');
    }

    console.log('Updated student:', student);
    return student;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};


const findAndUpdateStudent = async () => {
  try {
    const student = await Student.findOneAndUpdate(
      { email: 'alice@university.edu' },
      { $set: { age: 22 } },
      {
        new: true,
        runValidators: true,
        upsert: false,
      }
    );

    console.log('Updated student:', student);
    return student;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};


const updateWithSave = async (email) => {
  try {
    const student = await Student.findOne({ email });
    if (!student) {
      throw new Error('Student not found');
    }

    student.age = 22;
    student.gpa = 3.8;
    student.courses.push('CS303');

    const updated = await student.save();
    console.log('Updated student:', updated);
    return updated;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
};

module.exports = {
  updateOperatorsExample,
  updateStudent,
  updateStudentById,
  findAndUpdateStudent,
  updateWithSave,
};



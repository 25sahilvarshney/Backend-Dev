const mongoose = require('mongoose');
const express = require('express');

const createStudent = require('./crud_operations/create');
const { updateStudentById } = require('./crud_operations/update');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8001;

mongoose.connect('mongodb://localhost:27017/university')
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('Connection Error:', err));

app.post('/createStudent', async (req, res) => {
  try {
    const studentData = req.body;
    const savedStudent = await createStudent(studentData);
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error('Error creating student:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.put('/update-student/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const updates = req.body;

    const updatedStudent = await updateStudentById(studentId, updates);
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error.message);
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`server is connected http://localhost:${PORT}`);
});
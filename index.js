const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');

// Import models
const Exercise = require('./models/Exercise');
const User = require('./models/User');

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB', err);
  });

// Middleware
app.use(cors())
app.use(express.urlencoded({ extended: false }))
app.use(express.json());
app.use(express.static('public'))

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Route to create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = new User({ username});
    const savedUser = await newUser.save();
    res.json({
      username: savedUser.username,
      _id: savedUser._id
    });
  } catch (err) {
    res.status(500).json({ error: 'Error creating user' })
  }
})

// Route to get all the users(GET /api/users)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username _id') // only select username and _id
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users'})
  }
})

// Route to add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Format the date, default to today's date if empty
    const exerciseDate = date ? new Date(date) : new Date();

    // Create and save new exercise
    const exercise = new Exercise({
      userId,
      description,
      duration: parseInt(duration),
      date: exerciseDate
    });

    const savedExercise = await exercise.save();

    // Send response
    res.json({
      _id: user._id,
      username: user.username,
      date: savedExercise.date.toDateString(),
      duration: savedExercise.duration,
      description: savedExercise.description
    });
  } catch (err) {
    res.status(500).json({ error: 'Error adding exercise' });
  }
});

// Route to get exercise logs of a user
// GET /api/users/:_id/logs?from&to&limit
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    const { from, to, limit } = req.query;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Build query object for exercises
    const query = { userId };
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (from || to) query.date = dateFilter;

    // Find exercises matching the filters
    const exercises = await Exercise.find(query)
      .limit(parseInt(limit) || 0)
      .select('description duration date');

    // Format the exercises for the response
    const formattedExercises = exercises.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString()
    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: formattedExercises.length,
      log: formattedExercises
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching exercise logs' });
  }
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

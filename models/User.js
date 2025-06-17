const mongoose = require('mongoose');

// Define user schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    }
});

// Export the model to use in other files
module.exports = mongoose.model('User', userSchema);
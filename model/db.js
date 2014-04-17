var mongoose = require('mongoose');
require('express-mongoose');

exports.db = mongoose.connect('mongodb://localhost/chat');
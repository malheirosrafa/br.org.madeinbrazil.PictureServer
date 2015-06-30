'use strict';

var mongoose = require("mongoose");

module.exports = mongoose.model('picture', new mongoose.Schema({
    template: String,
    data : Buffer,
  })
);

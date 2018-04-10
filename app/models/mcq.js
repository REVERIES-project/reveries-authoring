var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var mcqSchema = mongoose.Schema({
    label: String,
    imageMode:Boolean,
    readonly: String,
    owner: String,
    status: String,    
    creationDate:Date,
    question: String,
    distractor1: String,
    distractor2: String,
    distractors:Array,
    response: String,
    media: { type: Schema.Types.ObjectId, ref: 'StaticMedia' },
    type: { type: String, default: 'mcq' },
    typeLabel: { type: String, default: 'Multiple choice question' },

    correctMessage: String,
    wrongMessage: String
})

module.exports = mongoose.model('MCQ', mcqSchema);
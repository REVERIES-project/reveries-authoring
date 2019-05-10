var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var GFS = mongoose.model("GFS", new Schema({}, {strict: false}), "fs.files" );

var mcqSchema = mongoose.Schema({
    label: String,
    imageMode:Boolean,
    readonly: String,
    owner: String,
    status: String,    
    creationDate:Date,
    question: String,
    distractors:Array,
    response: String,
    media: { type: Schema.Types.ObjectId, refPath: 'mediaModel' },
    mediaModel:{type:String,enum:['StaticMedia','GFS']},
    type: { type: String, default: 'mcq' },
    typeLabel: { type: String, default: 'Multiple choice question' },

    correctMessage: String,
    wrongMessage: String,
    score: Number
})

module.exports = mongoose.model('MCQ', mcqSchema);
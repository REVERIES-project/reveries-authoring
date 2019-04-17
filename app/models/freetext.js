var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var freeTextSchema = mongoose.Schema({
    label: String,
    readonly: String,
    owner: String,
    status: String,
    label: String,
    creationDate:Date,

    responseLabel: String,
    question: String,
    response: String,
    type: { type: String, default: 'freetext' },
    typeLabel: { type: String, default: 'Free text question' },
    media: { type: Schema.Types.ObjectId, ref: 'StaticMedia' },

    wrongMessage: String,
    correctMessage: String,
    score: Number
})

module.exports = mongoose.model('FreeText', freeTextSchema);
// load the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// define the schema for our user model
/*
var mapinfoSchema = mongoose.Schema({
    marker:String,
    centerLatitude:Number,
    centerLongitude:Number,
    zoomLevel:Number,
})*/
var mlg = mongoose.Schema({
    creationDate:Date,
    label: String,
    startpage:  { type: Schema.Types.ObjectId, refPath: 'startpageType',autopopulate:true  },
    startpageType:{type:String,enum:['StaticMedia','youtube']},
    endPage:  { type: Schema.Types.ObjectId, refPath: 'endpageType',autopopulate:true  },
    endpageType:{type:String,enum:['StaticMedia','youtube']},
    unitgameActivities: [{ type: Schema.Types.ObjectId, ref: 'Game',autopopulate:true }],
    type: { type: String, default: 'mlg' },
    typeLabel: { type: String, default: 'Mobile learning game' },
    owner: String,
    readonly: String,
    status: { type: String, default: 'Public' },
    badge: { type: Schema.Types.ObjectId, ref: 'Badge',autopopulate:true  },
    difficulty: Number,
    duration: Number,
    description: String,
});
mlg.plugin(require('mongoose-autopopulate'))
module.exports = mongoose.model('MLG', mlg);
// generating a hash
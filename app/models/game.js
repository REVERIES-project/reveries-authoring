// load the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var gameSchema = mongoose.Schema({

    label: String,
    // The media that are shown at the beginning and end 
    // of the game
    startMedia: { type: Schema.Types.ObjectId, refPath: 'startMediaType',autopopulate: true },
    startMediaType:{type:String,enum:['StaticMedia','youtube']},

    feedbackMedia: { type: Schema.Types.ObjectId, refPath: 'feedbackMediaType' ,autopopulate: true},
    feedbackMediaType:{type:String,enum:['StaticMedia','youtube']},


    // Unit games are associated with one or zero POI
    // if there is one, the user must reach it to start 
    // situated activities
    POI: { type: Schema.Types.ObjectId, ref: 'POI' ,autopopulate:true},
    poiMapGuidance:{type : Boolean,default:false},
    poiGuidance:{type:String,default:"map"},
    qrCorrect: String,
    qrIncorrect:String,
    // default fields for each resource type
    readonly: String,
    owner: String,
    creationDate: Date,
    status: { type: String, default: 'Private' },
    
    // Unit games have situated activities that can be of different type
    freetextActivities: [{ type: Schema.Types.ObjectId, ref: 'FreeText',autopopulate: true }],
    mcqActivities: [{ type: Schema.Types.ObjectId, ref: 'MCQ',autopopulate:true }],
    foliaActivities:[{type:Schema.Types.ObjectId,ref:'Folia',autopopulate:true}],
   
    // Unit games have optionnal inventory items
    inventoryItem: { type: Schema.Types.ObjectId, ref: 'InventoryItem',autopopulate:true },
    inventoryStep :String,
    // default value used during construction or deletion of unit game
    typeLabel: { type: String, default: 'Unit game' },
    type: { type: String, default: 'unitgame' },

});

// generating a hash
gameSchema.plugin(require('mongoose-autopopulate'));


module.exports = mongoose.model('Game', gameSchema);
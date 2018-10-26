// load the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var deepPopulate = require('mongoose-deep-populate')(mongoose);

var gameSchema = mongoose.Schema({

    label: String,
    // The media that are shown at the beginning and end 
    // of the game
    startMedia: { type: Schema.Types.ObjectId, ref: 'StaticMedia' },
    feedbackMedia: { type: Schema.Types.ObjectId, ref: 'StaticMedia' },
    

    // Unit games are associated with one or zero POI
    // if there is one, the user must reach it to start 
    // situated activities
    POI: { type: Schema.Types.ObjectId, ref: 'POI' },
    poiMapGuidance:{type : Boolean,default:false},
    poiReachedMessage: String,

    // default fields for each resource type
    readonly: String,
    owner: String,
    creationDate: Date,
    status: { type: String, default: 'Private' },
    
    // Unit games have situated activities that can be of different type
    freetextActivities: [{ type: Schema.Types.ObjectId, ref: 'FreeText' }],
    mcqActivities: [{ type: Schema.Types.ObjectId, ref: 'MCQ' }],
    foliaActivities:[{type:Schema.Types.ObjectId,ref:'Folia'}],
   
    // Unit games have optionnal inventory items
    inventoryItem: { type: Schema.Types.ObjectId, ref: 'InventoryItem' },

    // default value used during construction or deletion of unit game
    typeLabel: { type: String, default: 'Unit game' },
    type: { type: String, default: 'unitgame' },

});

// generating a hash
gameSchema.plugin(deepPopulate,{})

module.exports = mongoose.model('Game', gameSchema);
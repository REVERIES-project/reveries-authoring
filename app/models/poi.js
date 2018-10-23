var mongoose = require('mongoose');

var poiSchema = mongoose.Schema({
    owner: String,
    readonly: String,
    status: String,
    label: String,
    type: { type: String, default: 'poi' },
    typeLabel: { type: String, default: 'Point of interest' },
    comment: String,
    creationDate: Date,
    latitude: Number,
    longitude: Number,
    map: {
        marker: String,
        areaLat: Number,
        areaLong: Number,
        areaRadius: Number,
        mapLatitude: Number,
        mapLongitude: Number,
        mapZoom: Number,
    }
})

module.exports = mongoose.model('POI', poiSchema);
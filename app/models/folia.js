var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var foliaSchema = mongoose.Schema({
  label: String,
  readonly: String,
  owner: String,
  status: String,
  creationDate: Date,
  question: String,
  targetSpecies:Array, 
  type: { type: String, default: "folia" },
  typeLabel: { type: String, default: "Exercice d'identification" },
  wrongMessage: String,
  correctMessage: String,
  score: Number
});

module.exports = mongoose.model("Folia", foliaSchema);

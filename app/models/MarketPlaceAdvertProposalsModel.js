var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var MarketPlaceAdvertProposalSchema = new Schema({
	'owner' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'MarketPlaceInfluencer'
	},
	'starttime' : Date,
	'endtime' : Date,
	'message' : String,
    'status' : {type: String, default: "ACTIVE"},
	'createdon' : {type: Date, default: Date.now()},
	'level': {type: Number, default: 0},
	'platform': String,
	'advertlink' : {
		'link' : String,
		'createdon' : Date,
		'status' : String
	},
	'advert' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'AvailableAds'
	},
	'insight' : {
		'link' : String,
		'rating' : Number,
		'reason': String,
		'createdon' : Date,
		'status' : String
	}
});

module.exports = mongoose.model('MarketPlaceAdvertProposal', MarketPlaceAdvertProposalSchema);
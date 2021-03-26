var UserModel = require('../../models/UserModel.js');
var TrendingAdsModel = require('../../models/marketplace/TrendingAdsModel.js');
var AvailableAdsModel = require('../../models/marketplace/AvailableAdsModel.js');
var MarketPlaceBrandsModel = require('../../models/marketplace/MarketPlaceBrandsModel.js');
var MarketPlaceUserModel = require('../../models/marketplace/MarketPlaceUserModel.js');
var MarketPlaceInfluencerModel = require('../../models/marketplace/MarketPlaceInfluencerModel.js');
var MarketPlaceInfluencerNotificationsModel = require('../../models/marketplace/MarketPlaceInfluencerNotificationsModel.js');
var MarketPlaceBrandNotificationsModel = require('../../models/marketplace/MarketPlaceBrandNotificationsModel.js');
var MarketPlaceAdvertProposalsModel = require('../../models/marketplace/MarketPlaceAdvertProposalsModel.js');
var MarketPlacePaystackLogModel = require('../../models/marketplace/MarketPlacePaystackLogModel.js');
var MarketPlaceTransactionsJournalModel = require('../../models/marketplace/MarketPlaceTransactionsJournalModel.js');
var MarketPlaceWalletModel = require('../../models/marketplace/MarketPlaceWalletModel.js');
var AdbasadorWallet = require('../../models/marketplace/AdbasadorWallet.js');
var MarketPlaceSeedListsModel = require('../../models/marketplace/MarketPlaceSeedListsModel.js');
var MarketPlaceSupportModel = require('../../models/marketplace/MarketPlaceSupportModel.js');
var MarketPlaceLedgerJournalModel = require("../../models/marketplace/MarketPlaceLedgerJournalModel");

var mailer = require('../../utils/mailer');
var cloudinary = require('cloudinary').v2;
var config = require('../../../config');
var jwt = require('jsonwebtoken');
var secret = config.secret;
var uuid = require('node-uuid');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

cloudinary.config({
    cloud_name: 'dvytkanrg',
    api_key: '695117327935385',
    api_secret: 'WTms8o2ny61A3h2WsogjapwVBJQ'
});

var imageId = function () {
    return Math.random().toString(36).substr(2, 4);
};

var check = async () => {
    let wallets = await MarketPlaceWalletModel.find({}).populate("brand").populate("influencer").exec();

    console.log("wallets: ", wallets);
};

//check();

module.exports = {

    listAds: async function (req, res) {
        //let type = req.params.type === "available" ? "available" : "trending";
        let { page = 1, limit = 5 } = req.query;

        try {

            if(req.params.type === "trending") {
                let Ads = await TrendingAdsModel.find().limit(limit * 1).sort({createdon: 'desc'}).skip((page - 1) * limit).exec();
                let count = await TrendingAdsModel.countDocuments().exec();

                return res.status(200).json({data: Ads, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});

            } else {

                let Ads = await AvailableAdsModel.find({type: req.params.type, paidfor: true, to: {$gte: new Date()}}).sort({createdon: 'desc'}).limit(limit * 1).skip((page - 1) * limit).exec();
                let count = await AvailableAdsModel.countDocuments({type: req.params.type, paidfor: true, to: {$gte: new Date()}}).exec();

                return res.status(200).json({data: Ads, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});
            }
        }
        catch(error) {
            return res.status(500).json({
                message: 'Error when getting Ads.',
                error: error.message
            });
        }
    },

    listBrandAds: async function (req, res) {
        let { page = 1, limit = 5 } = req.query;

        try {

            let Ads = await AvailableAdsModel.find({owner: req.params.id}).populate("owner").sort({createdon: 'desc'}).limit(limit * 1).skip((page - 1) * limit).exec();
            let count = await AvailableAdsModel.countDocuments({owner: req.params.id}).exec();

            return res.status(200).json({data: Ads, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});
        }
        catch(error) {
            return res.status(500).json({
                message: 'Error when getting Ads.',
                error: error.message
            });
        }
    },

    listInfluencers: async function (req, res) {
        let { page = 1, limit = 5 } = req.query;

        try {

            let influencers = await MarketPlaceInfluencerModel.find({verified: true, identityverified: true}).limit(limit * 1).skip((page - 1) * limit).exec();
            let count = await MarketPlaceInfluencerModel.countDocuments({verified: true, identityverified: true}).exec();

            return res.status(200).json({status: 200, data: influencers, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});
        }
        catch(error) {
            return res.status(500).json({
                status: 500,
                message: 'Error when getting influencers.',
                error: error.message
            });
        }
    },

    listTrendingAds: async function (req, res) {
        let { page = 1, limit = 5 } = req.query;

        let Ads = await TrendingAdsModel.find({active: true}).exec();
        let count = await TrendingAdsModel.countDocuments({active: true}).exec();

        return res.status(200).json({data: Ads, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});
    },

    listNotifications: async function(req, res) {
        let { page = 1, limit = 5 } = req.query;

        try {

            if(req.params.owner === "INFLUENCER") {
                let influencer = await MarketPlaceInfluencerModel.findOne({email: req.verified.email}).exec();

                if(!influencer) return res.status(404).json({message: "User not found.", data: "user-not-found"});

                let notifications = await MarketPlaceInfluencerNotificationsModel.find({to: influencer._id}).sort({"createdon": 'desc'}).populate("campaign").populate("proposal").limit(limit * 1).skip((page - 1) * limit).exec();
                let count = await MarketPlaceInfluencerNotificationsModel.countDocuments({to: influencer._id}).exec();

                return res.status(200).json({data: notifications, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});

            } else {
                let brand = await MarketPlaceBrandsModel.findOne({email: req.verified.email}).exec();

                if(!brand) return res.status(404).json({message: "User not found.", data: "user-not-found"});

                let notifications = await MarketPlaceBrandNotificationsModel.find({owner: brand._id}).sort({"createdon": 'desc'}).populate("proposal").populate("owner").populate("campaign").populate("influencer").limit(limit * 1).skip((page - 1) * limit).exec();
                let count = await MarketPlaceBrandNotificationsModel.countDocuments({owner: brand._id}).exec();

                return res.status(200).json({data: notifications, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});
            }
        }
        catch(error) {
            return res.status(500).json({
                message: 'Error when getting notifications.',
                error: error.message
            });
        }
    },

    filterAdvert: async function(req, res) {
        let { page = 1, limit = 5 } = req.query;

        if(!req.body.categories && !req.body.channels && !req.body.pricefrom && !req.body.priceto && !req.body.date) return res.status(400).json({data: "No filter parameter was provided."});

        let query = {};

        req.body.categories ? query.category = { $in: req.body.categories} : "";
        req.body.channels ? query.channels = { $in: req.body.channels} : "";
        req.body.pricefrom ? query.budgetto =  {$tte: req.body.pricefrom, $lte: req.body.priceto} : "";
        req.body.date ? query.createdon = {$gte: req.body.date} : "";

        try {
            let filterresult;
            let count;

            if(req.body.adverttype === "trending") {
                count = await TrendingAdsModel.countDocuments(query).exec();
                filterresult = await TrendingAdsModel.find(query).exec();
            } else {
                filterresult = await AvailableAdsModel.find(query).exec();
                count = await AvailableAdsModel.countDocuments(query).exec();
            }
               
            return res.status(200).json({data: filterresult, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});
        }
        catch(error) {
            return res.status(500).json({
                message: 'Error when getting Ads.',
                error: error.message
            });
        }
    },

    login: async function(req, res) {
        if(!req.body.email || !req.body.password) return res.status(400).json({status: 400, message: "Email and password required."});

        try {
            let user = await MarketPlaceUserModel.findOne({email: req.body.email.trim().toLowerCase()}).exec();

            if(!user) return res.status(404).json({status: 404, message: 'Email or password incorrect.'});

            let match = await bcrypt.compare(req.body.password.trim(), user.password.trim());

            if (!match) return res.status(404).json({status: 404, success: false, message: 'Email or password incorrect.'});
            
            if(!user.verified) {
                return res.status(400).json({status: 400, message: "Your email is yet to be verified. Check your mail for an email activation link or request for a new link."})
            } else {

                var token = jwt.sign({email: user.email, role: user.role}, secret, {expiresIn: 86400000});

                return res.status(200).json({status: 200, success: true,message: 'Have fun!',token: token});
            }

        } catch (error) {
            return res.status(500).json({status: 500, message: 'Error processing requests.', error: error.message});
        }
    },

    getUserDetails: async function(req, res) {
        
        try {

            let user = await MarketPlaceUserModel.findOne({email: req.verified.email.trim().toLowerCase()}).exec();

            if(!user) return res.status(404).json({message: 'User not found.'});
            
            if(user.role === "INFLUENCER") {
                let influencer = await MarketPlaceInfluencerModel.findOne({email: req.verified.email.trim()}, {"__v" : false}).exec();

                return res.status(200).json({data: influencer, message: "User found.", role: user.role});
            } else {
                let brand = await MarketPlaceBrandsModel.findOne({email: req.verified.email.trim()}).exec();

                return res.status(200).json({data: brand, message: "User found.", role: user.role});
            }
        } catch (error) {
            return res.status(500).json({message: 'Error processing requests.', error: error.message});
        }
    },

    requestVerifyToken: async function(req, res) {
        if(!req.body.email) return res.status(400).json({message: "Email is required."});

        var verificationid = uuid.v4();

        try {
            let user = await MarketPlaceUserModel.findOne({email: req.body.email}).exec();
            if(!user) return res.status(404).json({message: "User not found."});

            let updateuser = await MarketPlaceUserModel.findOneAndUpdate({email: req.body.email}, {$set: {verificationid: verificationid, createdon: new Date().toLocaleString()}}).exec();

            if(!updateuser) return res.status(500).json({message: "Unable to update user."});

            let title = user.role === "INFLUENCER" ? "firstname" : "fullname";

            mailer.sendEmailVerificationMail(user[title], config.baseurl + '/emailVerification/' + verificationid, req.body.email);

            return res.status(200).json({message: "Verification token has been sent to user's registered email address."});

        } catch (error) {
            return res.status(500).json({error: error.message,message: 'Error when processing requests.'});
        }
    },

    verifyToken: async function (req, res) {
        var token = req.body.token;
        if(!token) return res.status(400).json({message: "Token is required."});

        try {
            let user = await MarketPlaceUserModel.findOne({verificationid: token}).exec();
            if(!user) return res.status(404).json({message: "Token invalid."});

            if(user.verified) return res.status(404).json({message: 'Email already verified.'});
            
            if(!user.verified) {
                var expirydate = new Date(user.createdon);
                expirydate.setDate(expirydate.getDate() + 2);

                if (expirydate > new Date()) { //token is still valid.

                    user.verified = true;
                    user.verifiedon = new Date();
                    
                    let saveuser = await user.save();

                    if(saveuser) {
                        if(user.role === "BRAND") {
                            let updatebrand = await MarketPlaceBrandsModel.findOneAndUpdate({parent: user._id}, {$set: {verified: true}});

                            if(!updatebrand) return res.status(500).json({status: false, message: 'Unable to update brand'});

                            return res.status(200).json({status: true, message: 'Activation successful!'});
                        } else {
                            let updateinfluencer = await MarketPlaceInfluencerModel.findOneAndUpdate({parent: user._id}, {$set: {verified: true}});

                            if(!updateinfluencer) return res.status(500).json({status: true, message: 'Unable to update influencer!'});

                            return res.status(200).json({status: true, message: 'Activation successful!'});
                        }
                    }
                }
                else {
                    var verificationid = uuid.v4();
                            
                    mailer.sendEmailVerificationMail(user.firstname, config.baseurl + '/api/auth/activate/' + verificationid, user.email);

                    return res.status(404).json({message: 'Activation link expired.'});
                }
            }
        } catch (error) {
            return res.status(500).json({error: error.message,message: 'Error when processing requests.'});
        }
    },

    requestPasswordReset: async function (req, res) {
        var email = req.body.email;
        if(!email) return res.status(400).json({message: "Email is required."});

        try {
            let user = await MarketPlaceUserModel.findOne({email: email}).exec();
            if(!user) return res.status(404).json({message: 'User not found.'});

            let token = uuid.v4();

            let updateuser = await MarketPlaceUserModel.findOneAndUpdate({email: email}, {$set: {passwordresettoken: token, passwordresettokenexpires: new Date() + 3600000}}).exec();

            if(!updateuser) return res.status(500).json({message: "Unable to update user."});

            mailer.sendPasswordResetMail(user.firstname, req.body.email, config.baseurl + '/changepassword/' + token);

            return res.status(200).json({status: true, message: 'Please check your email inbox to proceed.'});

        } catch (error) {
            return res.status(500).json({error: error.message,message: 'Error when processing requests.'});
        }
    },

    resetPassword: async function (req, res) {
        var id = req.params.id;

        try {
            let user = await MarketPlaceUserModel.findOne({passwordresettoken: id}).exec();
            if(!user) return res.status(404).json({message: 'User not found.'});

            var expirydate = new Date(user.passwordresettokenexpires);
            var ONE_HOUR = 60 * 60 * 1000;

            if (((new Date) - expirydate) > ONE_HOUR) return res.status(404).json({message: 'This link has been used already. Restart the reset process.'});

            return res.status(200).json({status: "success",vmessage: "Token valid", resettoken: id});

        } catch (error) {
            return res.status(500).json({error: error.message,message: 'Error when processing requests.'});
        }
    },

    changePassword: async function (req, res) {
        var id = req.params.id;
        if(!req.body.password) return res.status(400).json({message: "Password required."});

        try {
            let user = await MarketPlaceUserModel.findOne({passwordresettoken: id}).exec();
            if(!user) return res.status(404).json({message: 'User not found.'});

            user.passwordresettoken = "";
            user.passwordresettokenexpires = "";
            user.password = req.body.password;

            user.save(err => {
                if(err) return res.status(500).json({error: err.message, message: 'Error when processing requests.'});

                return res.status(200).json({message: "Password change was successful."});
            });

        } catch (error) {
            return res.status(500).json({error: error.message,message: 'Error when processing requests.'});
        }
    },

    vote: async function(req, res) {

        if(req.params.status.toLowerCase() !== "yes" && req.params.status.toLowerCase() !== "no") return res.status(400).json("Accepted parameters are 'yes' or 'no'.");
    
        try {
            var ad = await TrendingAdsModel.findOne({_id: req.params.id}).exec();
            if(!ad) return res.status(404).json({message: "Ad not found."});

            let influencer = await MarketPlaceInfluencerModel.findOne({email: req.verified.email}).exec();
            if(!influencer) return res.status(404).json({message: "User not found."});

            if(ad.voters.includes(influencer._id)) return res.status(400).json({message: "Already voted this ad."});

            var status = req.params.status.toLowerCase() === "yes" ? "yescount" : "nocount";

            var updateads = await TrendingAdsModel.findOneAndUpdate({_id: req.params.id}, {$inc: {[status]: 1}, $push: {"voters": influencer._id}}).exec();

            if(!updateads) return res.status(404).json({message: 'Unable to update ads.'});
            
            return res.status(200).json({status: true, message: "Updated."});

        } catch (error) {
            return res.status(500).json({error: error.message,message: 'Error when processing requests.'});
        }
    },

    countDownloads: async function(req, res) {
    
        try {
            var ad = await TrendingAdsModel.findOne({_id: req.params.id}).exec();
            if(!ad) return res.status(404).json({message: "Ad not found."});

            let influencer = await MarketPlaceInfluencerModel.findOne({email: req.verified.email}).exec();
            if(!influencer) return res.status(404).json({message: "User not found."});

            if(ad.downloaders.includes(influencer._id)) return res.status(400).json({message: "Already downloaded this ad."});

            var updatead = await TrendingAdsModel.findOneAndUpdate({_id: req.params.id}, {$inc: {"downloads": 1}, $push: {"downloaders": influencer._id}}).exec();

            if(!updatead) return res.status(404).json({message: 'Unable to update ads.'});
            
            return res.status(200).json({status: true, message: "Updated."});

        } catch (error) {
            return res.status(500).json({error: error.message,message: 'Error when processing requests.'});
        }
    },

    makeTrendingAdAvailable: async function(req, res) {
        //to complete.
    },

    fetchAdvertInfluencers: async function(req, res) {
        try {
            let influencers = await MarketPlaceInfluencerModel.find({appliedadverts: req.params.id}, {"__v:": 0}).exec();//.populate("activead", "-__v").exec();

            return res.status(200).json({message: "List of influencers.", data: influencers});

        } catch (error) {
            return res.status(500).json({error: error.message, message: 'Error when processing requests.'});
        } 
    },

    view: async function(req, res) {
          if(req.params.type.toLowerCase() !== "available" && req.params.type.toLowerCase() !== "active" && req.params.type.toLowerCase() !== "trending") {
            return res.status(400).json({message: "The advert should be either available, active or trending"});
        }
        var ModelToUpdate = ''
        req.params.type.toLowerCase() == "available" ? ModelToUpdate = AvailableAdsModel : req.params.type.toLowerCase() == "trending" ? ModelToUpdate = TrendingAdsModel : ModelToUpdate = "" 
            try {
                var ad = await ModelToUpdate.findOne({_id: req.params.id}).exec();
                console.log(ad, req.params,  "i am the ad")
                if(!ad) {
                    return res.status(404).json({message: "Ad not found."});
                }
                var updated = await ModelToUpdate.findOneAndUpdate({_id: req.params.id}, {$inc: {["views"]: 1}}).exec();

                if(!updated) {
                        return res.status(404).json({message: 'Unable to update ad.'});
                    }
                    else {
                        return res.status(200).json({status: true, message: "Updated."});
                    }                          
            }
            catch (error) {
                return res.status(500).json({error: error.message,message: 'Error while processing requests.'});
            }
        
    },

    getCampaignById: async function(req, res) {
        if(req.params.type.toLowerCase() !== "available" && req.params.type.toLowerCase() !== "active" && req.params.type.toLowerCase() !== "trending") {
          return res.status(400).json({message: "The advert should be either available, active or trending"});
      }
      var ModelToUpdate = ''
      req.params.type.toLowerCase() == "available" ? ModelToUpdate = AvailableAdsModel : req.params.type.toLowerCase() == "trending" ? ModelToUpdate = TrendingAdsModel : ModelToUpdate = AvailableAdsModel; 
          try {
              var ad = await ModelToUpdate.findOne({_id: req.params.id}).populate("owner").populate("comments.from").exec();
              if(!ad) {
                  return res.status(404).json({message: "Ad not found."});
              }
              return res.status(200).json({status: true, data: ad});                        
          }
          catch (error) {
              return res.status(500).json({error: error.message,message: 'Error while processing requests.'});
          }
      
    },

    getInfluencer: async function(req, res) {
        try {
            var influencer = await MarketPlaceInfluencerModel.findOne({_id: req.params.id}).exec();
            if(!influencer) return res.status(404).json({message: "Influencer not found."});
            
            return res.status(200).json({status: 200, data: influencer});                        
        }
        catch (error) {
            return res.status(500).json({error: error.message,message: 'Error while processing requests.'});
        }
    },

    updateExpiredCampaigns: async function() {
        try {
            let pastinfluencerproposals = await MarketPlaceAdvertProposalsModel.find({status: "ENGAGED", starttime: { $exists: true }, endtime: {$lt: new Date()}}).populate("advert").populate("owner").exec();

            let insertarray = [], influencers = [];

            if(pastinfluencerproposals.length) {
                pastinfluencerproposals.forEach(influencer => {
                    influencers.push(influencer.owner);
                });

                pastinfluencerproposals.forEach(prop => {
                    let obj = {};
    
                    obj["title"] = "Campaign Completed!";
                    obj["message"] = "You have successfully concluded the campaign for the " + prop.advert.name + " advert. You will no longer be able to earn from this campaign. You are now required to upload the insight for this advert so that you can recieve your payment.";
                    obj["type"] = "ADVERTCOMPLETED";
                    obj["campaign"] = prop.advert._id;
                    obj["to"] = prop.owner._id;
                    obj["proposal"] = prop._id;
                    obj["createdon"] = new Date().toLocaleString();

                    mailer.sendInfluencerNotificationMail(prop.owner.email, "Campaign Completed!", "You have successfully concluded the campaign for the " + prop.advert.name + " advert. You will no longer be able to earn from this campaign. You are now required to upload the insight for this advert so that you can recieve your payment.");

                    insertarray.push(obj);
                });

                let updatepastproposals = await MarketPlaceAdvertProposalsModel.updateMany({status: "ENGAGED", starttime: { $exists: true }, endtime: {$lt: new Date()}}, {$set: {status: "COMPLETED"}}).exec();

                let insertmanynotifications = await MarketPlaceInfluencerNotificationsModel.create(insertarray);

                console.log("UPDATING MANY PROPOSALS DURING CRON JOB: ", updatepastproposals);
                console.log();
                console.log("INSERTING MANY NOTIFICATIONS DURING CRON JOB: ", insertmanynotifications);
            } else {
                console.log();
                console.log("NO EXPIRED CAMPAIGNS TO UPDATE!!");
                console.log();
            }

        } catch (error) {
            console.log("error: ", error.message);
        }
    },

    initiatePaystackTransaction: async function(req, res) {

        if(!req.body.amount) return res.status(400).json({data: "amount required."});
        if(!req.body.owner) return res.status(400).json({data: "Owner required."});
        if(!req.body.id) return res.status(400).json({data: "ID required."});

        try {
            let user = await MarketPlaceUserModel.findOne({email: req.verified.email}).exec();
            if(!user) return res.status(404).json({message: "User not found."});

            var mktptrxnjnl = new MarketPlaceTransactionsJournalModel();
            var ref = uuid.v4();

            mktptrxnjnl.txnref = ref;
            mktptrxnjnl.amount = req.body.amount;
            mktptrxnjnl.title = "Account Funding";

            if(req.body.owner === "BRAND") {
                mktptrxnjnl.brand = req.body.id;
            } else {
                mktptrxnjnl.influencer = req.body.id;
            }

            mktptrxnjnl.save((err, saved) => {
                
                if(err) return res.status(500).json({error: err.message, message: 'Error while processing requests.'});

                return res.status(200).json({data: ref});
            });

        } catch (error) {
            return res.status(500).json({
                message: 'Error when processing results.',
                error: error.message
            });
        }
    },

    //for paystack.
    confirmAndLogPayEvents: async function(req, res) {

        var hash = crypto.createHmac('sha512', config.paystack_sk).update(JSON.stringify(req.body)).digest('hex');

	    if (hash == req.headers['x-paystack-signature']) {

	        var event = req.body;

	        var eventlog = new MarketPlacePaystackLogModel();

	        eventlog.log = event;

	        eventlog.save(function(err) {
                if (err) {
                    console.log(err);
                }
            });

            try {

                let transaction = await MarketPlaceTransactionsJournalModel.findOne({ txnref: event.data.reference, success: false }).exec();

                if(!transaction) console.log("Unable to find transaction with that ref: ", event.data.reference);

                let walletowner = transaction.brand ? "brand" : "influencer";

                if(event.data.status === "success") {
                    let givevalue = await MarketPlaceTransactionsJournalModel.findOneAndUpdate({ txnref: event.data.reference, success: false }, {$set: {success: true}}).exec();
                    let updatewallet = await MarketPlaceWalletModel.findOneAndUpdate({[walletowner]: transaction[walletowner]}, {$inc: {balance: event.data.amount * 0.01}, $push: {transactions: event.data.reference, $set: {lastupdated: new Date()}}}).exec();

                    if(!givevalue) console.log("UNABLE TO UPDATE TRANSACTION JOURNAL AFTER PAYSTACK PAYMENT VERIFICATION.");
                    if(!updatewallet) console.log("UNABLE TO UPDATE WALLET AFTER PAYSTACK PAYMENT VERIFICATION.");

                    if(walletowner === "brand") {
                        let unpaidadverts = await AvailableAdsModel.find({owner: transaction[walletowner], paidfor: false}).populate("owner").exec();

                        if(unpaidadverts.length) {
                            let unpaidadverttotalcost = 0, totalinfluencers = 0, costsarray = [];

                            for(var i=0; i<unpaidadverts.length; i++) {
                                let advertcost = unpaidadverts[i].slots * unpaidadverts[i].budgetto;

                                costsarray.push(advertcost);
                            }

                            costsarray.forEach(cost => {
                                unpaidadverttotalcost += cost;
                            });

                            if((updatewallet.balance + event.data.amount * 0.01) >= unpaidadverttotalcost) {
                                let updateunpaidadverts = await AvailableAdsModel.updateMany({owner: transaction[walletowner], paidfor: false}, {$set: {paidfor: true, status: "ACTIVE"}}).exec();

                                if(!updateunpaidadverts) console.log("UNABLE TO UPDATE UNPAID ADVERTS AFTER PAYSTACK PAYMENT VERIFICATION.");

                                let eligibleinfluencers = await MarketPlaceInfluencerModel.find({}).exec(), listofids = [], listofemails = [];

                                //to notify only eligible influencers for each unpaid advert.

                                console.log("eligible influencers: ", eligibleinfluencers);

                                if(eligibleinfluencers.length) {
                                    eligibleinfluencers.forEach(influencer => {
                                        listofids.push(influencer._id);
                                        listofemails.push(influencer.email);
                                    });
                                }

                                let insertarray = [];

                                unpaidadverts.forEach(advert => {
                                    let obj = {};
                    
                                    obj["title"] = "New Advert Alert";
                                    obj["message"] = advert.advertinfo;
                                    obj["type"] = "notification";
                                    obj["campaign"] = advert._id;
                                    obj["to"] = listofids;
                                    obj["createdon"] = new Date().toLocaleString();
                    
                                    insertarray.push(obj);
                                });

                                let createmanynots = await MarketPlaceInfluencerNotificationsModel.create(insertarray);

                                let updatebrandwallet = await MarketPlaceWalletModel.findOneAndUpdate({brand: transaction[walletowner]}, {$inc: {balance: -1 * unpaidadverttotalcost}, $set: {lastupdated: new Date().toLocaleString()}}).exec();
                                let updatebrandledger = await MarketPlaceLedgerJournalModel.findOneAndUpdate({brand: transaction[walletowner]}, {$inc: {balance: unpaidadverttotalcost}, $set: {lastupdated: new Date().toLocaleString()}}).exec();

                                if(!updatebrandwallet) console.log("Unable to update brand wallet at create available advert.");
                                if(!updatebrandledger) console.log("Unable to update brand ledger at create available advert.");

                                let brndobj = new MarketPlaceTransactionsJournalModel();

                                brndobj["txnref"] = uuid.v4();
                                brndobj["amount"] = unpaidadverttotalcost;
                                brndobj["title"] = "Campaign debit";
                                brndobj["brand"] = transaction[walletowner];
                                brndobj["success"] = true;
                                brndobj["createdon"] = new Date().toLocaleString();

                                brndobj.save();

                                listofemails.forEach(mail => {
                                    mailer.sendInfluencerNotificationMail(mail, "New advert alert!", "Please login to view and apply for new advert(s) from " + unpaidadverts[0].brandname + " brand.");
                                });

                                if(!createmanynots) console.log("UNABLE TO CREATE MULTIPLE NOTIFICATIONS AFTER PAYSTACK PAYMENT VERIFICATION.");
                            } else {
                                console.log("AMOUNT PAID IS NOT ENOUGH TO CATER FOR UNPAID ADVERTS. HENCE, ABORTING NOTIFICATIONS.");
                            }
                        }
                    }
                }

            } catch (error) {
                return res.status(500).json({error: error.message,message: 'Error while processing requests.'});
            }
	    } else {
            console.log("hashes don't match.");
        }

        return res.status(200).json(200);
    },

    filterInfluencers: async function(req, res) {
        if(!req.body.niche && !req.body.socialmediachannels && !req.body.ratingsfrom && !req.body.engagmentsfrom && !req.body.reachfrom) return res.status(400).json({data: "No filter parameter was provided."});

        let query = {};

        req.body.niche ? query.niche = { $in: req.body.niche} : "";
        req.body.socialmediachannels ? query.socialmediachannels = { $in: req.body.socialmediachannels} : "";
        req.body.ratingsfrom ? query.ratings = {$lte: req.body.ratingsfrom, $gte: req.body.ratingsto} : "";
        req.body.engagmentsfrom ? query.engagments = {$lte: req.body.engagmentsfrom, $gte: req.body.engagmentsto} : "";
        req.body.reachfrom ? query.reach = {$lte: req.body.reachfrom, $gte: req.body.reachto} : "";
        req.body.reachfrom ? query.reach = {$lte: req.body.reachfrom, $gte: req.body.reachto} : "";
        req.body.advertpricefrom ? query.price = {$lte: req.body.advertpricefrom, $gte: req.body.advertpriceto} : "";

        try {
            let filterresult;

            filterresult = await MarketPlaceInfluencerModel.find(query).exec();
               
            return res.status(200).json({data: filterresult});
        }
        catch(error) {
            return res.status(500).json({
                message: 'Error when getting Ads.',
                error: error.message
            });
        }
    },

    getWalletBalance: async function(req, res) {
        
        try {
            let user = await MarketPlaceUserModel.findOne({email: req.verified.email}).exec();
            if(!user) return res.status(404).json({message: "User not found."});

            let owner = req.params.owner.toLowerCase() === "brand" ? "brand" : "influencer";

            var wallet = await MarketPlaceWalletModel.findOne({[owner]: req.params.id}).exec();
            if(!wallet) return res.status(404).json({message: "Wallet for user not found."});

            return res.status(200).json({status: true, data: wallet});                        
        }
        catch (error) {
            return res.status(500).json({error: error.message,message: 'Error while processing requests.'});
        }
    },

    getLedgerBalance: async function(req, res) {
        try {
            let user = await MarketPlaceUserModel.findOne({email: req.verified.email}).exec();
            if(!user) return res.status(404).json({message: "User not found."});

            let owner = req.params.owner.toLowerCase() === "brand" ? "brand" : "influencer";

            var ledger = await MarketPlaceLedgerJournalModel.findOne({[owner]: req.params.id}).exec();
            if(!ledger) return res.status(404).json({message: "Ledger for user not found."});

            return res.status(200).json({status: true, data: ledger});                        
        }
        catch (error) {
            return res.status(500).json({error: error.message,message: 'Error while processing requests.'});
        }
    },

    getTransactionHistory: async function(req, res) {
        let { page = 1, limit = 5 } = req.query;

        try {
            let user = await MarketPlaceUserModel.findOne({email: req.verified.email}).exec();
            if(!user) return res.status(404).json({message: "User not found."});

            let searchkey = req.body.owner === "BRAND" ? "brand" : "influencer";

            var transactions = await MarketPlaceTransactionsJournalModel.find({[searchkey]: req.params.id, success: true}).limit(limit * 1).skip((page - 1) * limit).exec();

            let count = await MarketPlaceTransactionsJournalModel.countDocuments({[searchkey]: req.params.id, success: true}).exec();

            return res.status(200).json({data: transactions, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});
        }
        catch (error) {
            return res.status(500).json({error: error.message,message: 'Error while processing requests.'});
        }
    },

    getVipInfluencers: async function(req, res) {
        let { page = 1, limit = 5 } = req.query;

        try {

            let influencers = await MarketPlaceInfluencerModel.find({verified: true, premium: true}).limit(limit * 1).skip((page - 1) * limit).exec();
            let count = await MarketPlaceInfluencerModel.countDocuments({verified: true, premium: true}).exec();

            return res.status(200).json({data: influencers, totalpages: Math.ceil(count / limit), currentpage: page, elements: count});
        }
        catch(error) {
            return res.status(500).json({
                message: 'Error when getting influencers.',
                error: error.message
            });
        }
    },

    markNotificationRead: async function(req, res) {
        try {

            if(req.params.owner === "INFLUENCER") {
                let influencer = await MarketPlaceInfluencerModel.findOne({email: req.verified.email}).exec();
                if(!influencer) return res.status(404).json({message: "User not found.", data: "user-not-found"});

                let updatenotification = await MarketPlaceInfluencerNotificationsModel.findOneAndUpdate({to: influencer._id, _id: req.body.notification}, {$set: {status: "READ"}}).exec();

                if(updatenotification) return res.status(200).json({message: 'Update successful!', data: "update-successful"});
                else return res.status(500).json({message: "Unable to update notification."});

            } else {
                let brand = await MarketPlaceBrandsModel.findOne({email: req.verified.email}).exec();
                if(!brand) return res.status(404).json({message: "User not found.", data: "user-not-found"});

                let updatenotification = await MarketPlaceBrandNotificationsModel.findOneAndUpdate({owner: brand._id, _id: req.body.notification}, {$set: {status: "READ"}}).exec();

                if(updatenotification) return res.status(200).json({message: 'Update successful!', data: "update-successful"});
                else return res.status(500).json({message: "Unable to update notification."})
            }
        }
        catch(error) {
            return res.status(500).json({
                message: 'Error when getting notifications.',
                error: error.message
            });
        }
    },

    handleSocialMediaAuth: async function(req, res) {
        console.log("req: ", req.body);
        console.log("Para.s: ", req.params);
    },

    remindAndRevertPremuimStatus: async function() {
        try {
            let allpendingwallets = await MarketPlaceWalletModel.find({premiumstatus: "PENDING", premium: true}).exec();

            if(allpendingwallets.length) {
                //revert the premium status of all those whose notification counter is 3.
                let affectedusers = await MarketPlaceWalletModel.find({premiumstatus: "PENDING", premium: true, premiumstatuscounter: {$gte: 3}}).populate("influencer").populate("brand").exec();

                if(affectedusers.length) {
                    let revertpremiumstatus = await MarketPlaceWalletModel.updateMany({premiumstatuscounter: 3, premiumstatus: "PENDING", premium: true}, {$set: {
                        premium: false, 
                        nextbillingprice: 0, 
                        lastbilledon: new Date(), 
                        premiumuser: "",
                        premiumstatus: "",
                        "premiumpackage.starterprice": 0,
                        "premiumpackage.continuityprice": 0,
                        premiumstagecounter: 0,
                        nextbillingdate: new Date(),
                        premiumstatuscounter: 0
                    }}).exec();

                    if(!revertpremiumstatus) console.log("unable to reverse premium status");

                    let listofemails = [];

                    affectedusers.forEach(user => {
                        listofemails.push(user.brand.email);
                        listofemails.push(user.influencer.email);
                    });

                    //let bigboysinfluencers = await MarketPlaceInfluencerModel.find().where('_id').in(listofinfluencerids).exec();
                    //let bigboysbrands = await MarketPlaceInfluencerModel.find().where('_id').in(listofbrandids).exec();

                    // if(bigboysinfluencers.length) {
                    //     bigboysinfluencers.forEach(user => {
                    //         listofemails.push(user.email);
                    //     });
                    // }

                    // if(bigboysbrands.length) {
                    //     bigboysbrands.forEach(user => {
                    //         listofemails.push(user.email);
                    //     });
                    // }

                    listofemails.forEach(email => {
                        mailer.sendPremiumRevertedMail(email);
                    });

                } else {
                    console.log("No wallet to reverse.");
                }

                let toremindusers = await MarketPlaceWalletModel.find({premiumstatus: "PENDING", premium: true, premiumstatuscounter: {$lt: 3}}).populate("influencer").populate("brand").exec();

                if(toremindusers.length) {
                    let listofemails = [];

                    toremindusers.forEach(user => {
                        listofemails.push(user.brand.email);
                        listofemails.push(user.influencer.email);
                    });

                    listofemails.forEach(email => {
                        mailer.sendPremiumRevertedMail(email);
                    });

                    listofemails.forEach(email => {
                        mailer.sendPremiumPendingReminderMail(email);
                    });
                }

            } else {
                console.log("No pending premium user to remind or reverse.")
            }
        } catch (error) {
            
        }
    },

    billPremiumUsers: async function() {
        let influencerstarter = 500, influencercontinuity = 2280, brandstarter = 1000, brandcontinuity = 3800;

        try {
            let allbilling = await MarketPlaceWalletModel.find({premiumstatus: "ACTIVE", premium: true, nextbillingdate: {$lt: new Date()}}).exec();

            //find all those eligible for billing but whose balance is insufficient.
            //set their premium status to pending
            //create a cron job for them.
            //notify them only 3 times.
            //the 4th time revert their premium status.
            //proceed to bill the rest

            //come back here and remind them the first time.

            if(allbilling.length) {
                let insufficientinfluencerstarterbalances = await MarketPlaceWalletModel.find({premiumstatus: "ACTIVE", premium: true, premiumuser: "INFLUENCER", premiumstagecounter: {$lte: 3}, balance: {$lt: influencerstarter}, nextbillingdate: {$lt: new Date()}}).exec();

                if(insufficientinfluencerstarterbalances.length) {
                    let updateinsufficientbalances = await MarketPlaceWalletModel.updateMany({premiumstatus: "ACTIVE", premium: true, premiumuser: "INFLUENCER", premiumstagecounter: {$lte: 3}, balance: {$lt: influencerstarter}, nextbillingdate: {$lt: new Date()}, $set: {premiumstatus: "PENDING"}}).exec();
                    if(!updateinsufficientbalances) console.log("1. UNABLE TO UPDATE INSUFFICIENT BALANCES AT CRON JOB.");
                }

                let insufficientinfluencercontinuitybalances = await MarketPlaceWalletModel.find({premiumstatus: "ACTIVE", premium: true, premiumuser: "INFLUENCER", premiumstagecounter: {$gt: 3}, balance: {$lt: influencercontinuity}, nextbillingdate: {$lt: new Date()}}).exec();
                if(insufficientinfluencercontinuitybalances.length) {
                    let updateinsufficientbalances = await MarketPlaceWalletModel.updateMany({premiumstatus: "ACTIVE", premium: true, premiumuser: "INFLUENCER", premiumstagecounter: {$gt: 3}, balance: {$lt: influencercontinuity}, nextbillingdate: {$lt: new Date()}, $set: {premiumstatus: "PENDING"}}).exec();
                    if(!updateinsufficientbalances) console.log("2. UNABLE TO UPDATE INSUFFICIENT BALANCES AT CRON JOB.");
                }

                let insufficientbrandstarterbalances = await MarketPlaceWalletModel.find({premiumstatus: "ACTIVE", premium: true, premiumuser: "BRAND", premiumstagecounter: {$lte: 3}, balance: {$lt: brandstarter}, nextbillingdate: {$lt: new Date()}}).exec();
                if(insufficientbrandstarterbalances.length) {
                    let updateinsufficientbalances = await MarketPlaceWalletModel.updateMany({premiumstatus: "ACTIVE", premium: true, premiumuser: "BRAND", premiumstagecounter: {$lte: 3}, balance: {$lt: brandstarter}, nextbillingdate: {$lt: new Date()}, $set: {premiumstatus: "PENDING"}}).exec();
                    if(!updateinsufficientbalances) console.log("3. UNABLE TO UPDATE INSUFFICIENT BALANCES AT CRON JOB.");
                }

                let insufficientbrandcontinuitybalances = await MarketPlaceWalletModel.find({premiumstatus: "ACTIVE", premium: true, premiumuser: "BRAND", premiumstagecounter: {$gt: 3}, balance: {$lt: brandcontinuity}, nextbillingdate: {$lt: new Date()}}).exec();
                if(insufficientbrandcontinuitybalances.length) {
                    let updateinsufficientbalances = await MarketPlaceWalletModel.updateMany({premiumstatus: "ACTIVE", premium: true, premiumuser: "BRAND", premiumstagecounter: {$gt: 3}, balance: {$lt: brandcontinuity}, nextbillingdate: {$lt: new Date()}, $set: {premiumstatus: "PENDING"}}).exec();
                    if(!updateinsufficientbalances) console.log("4. UNABLE TO UPDATE INSUFFICIENT BALANCES AT CRON JOB.");
                }
                
                //start actual billing.
                let billinfluencerstarter = await MarketPlaceWalletModel.updateMany(
                    {premium: true, premiumstatus: "ACTIVE", premiumuser: "INFLUENCER", premiumstagecounter: {$lte: 3}, nextbillingdate: {$lt: new Date()}, balance: {$gte: influencerstarter}}, 
                    {$set: {lastbilledon: new Date, nextbillingdate: new Date(new Date().setHours(new Date().getHours() + (30*24)))}, 
                    $inc: {balance: -1 * influencerstarter, premiumstatuscounter: 1}}).exec();

                if(billinfluencerstarter.nModified) {
                    let updatesystemwallet = await AdbasadorWallet.findOneAndUpdate({owner: "Adbasador"}, {$inc: {balance: influencerstarter * billinfluencerstarter.nModified}, $set: {lastupdated: new Date()}} ).exec();

                    let eligibleinfluencerstarters = await MarketPlaceWalletModel.find({premium: true, premiumuser: "INFLUENCER", premiumstagecounter: {$lt: 3}, nextbillingdate: {$lt: new Date()}}).exec();

                    let transactionsarray = [];

                    eligibleinfluencerstarters.forEach(trxn => {
                        let billtransactions = {}, adbasadortrnx = {};

                        billtransactions["txnref"] = uuid.v4();
                        billtransactions["amount"] = influencerstarter;
                        billtransactions["title"] = "Premium monthly billing.";
                        billtransactions["influencer"] = trxn.owner;
                        billtransactions["success"] = true;
                        billtransactions["createdon"] = new Date();
                        billtransactions["type"] = "debit";

                        transactionsarray.push(billtransactions);

                        adbasadortrnx["txnref"] = uuid.v4();
                        adbasadortrnx["amount"] = influencerstarter;
                        adbasadortrnx["title"] = "Influencer monthly billing.";
                        adbasadortrnx["system"] = "Adbasador";
                        adbasadortrnx["success"] = true;
                        adbasadortrnx["createdon"] = new Date();
                        adbasadortrnx["type"] = "credit";

                        transactionsarray.push(adbasadortrnx);
                    });

                    let inserttrxns = await MarketPlaceTransactionsJournalModel.create(transactionsarray);

                    if(!inserttrxns) console.log("UNABLE TO CREATE MANY TRANSACTIONS FOR INFLUENCER STARTER!");
                    if(!updatesystemwallet) console.log("UNABLE TO UPDATE ADBASADOR WALLET!");
                }

                let billinfluencercontinuity = await MarketPlaceWalletModel.updateMany({premium: true, premiumuser: "INFLUENCER", premiumstagecounter: {$gt: 3}, nextbillingdate: {$lt: new Date()}}, {$set: {lastbilledon: new Date, nextbillingdate: new Date(new Date().setHours(new Date().getHours() + (30*24)))}, $inc: {balance: -1 * influencercontinuity}}).exec();

                if(billinfluencercontinuity.nModified) {
                    let eligibleinfluencercontinuity = await MarketPlaceWalletModel.find({premium: true, premiumuser: "INFLUENCER", premiumstagecounter: {$gt: 3}, nextbillingdate: {$lt: new Date()}}).exec();

                    let updatesystemwallet = await AdbasadorWallet.findOneAndUpdate({owner: "Adbasador"}, {$inc: {balance: influencercontinuity * billinfluencercontinuity.nModified}, $set: {lastupdated: new Date()}} ).exec();

                    let transactionsarray = [];

                    eligibleinfluencercontinuity.forEach(trxn => {
                        let billtransactions = {}, adbasadortrnx = {};

                        billtransactions["txnref"] = uuid.v4();
                        billtransactions["amount"] = influencercontinuity;
                        billtransactions["title"] = "Premium monthly billing.";
                        billtransactions["influencer"] = trxn.owner;
                        billtransactions["success"] = true;
                        billtransactions["createdon"] = new Date();
                        billtransactions["type"] = "debit";

                        transactionsarray.push(billtransactions);

                        adbasadortrnx["txnref"] = uuid.v4();
                        adbasadortrnx["amount"] = influencercontinuity;
                        adbasadortrnx["title"] = "Influencer monthly billing.";
                        adbasadortrnx["system"] = "Adbasador";
                        adbasadortrnx["success"] = true;
                        adbasadortrnx["createdon"] = new Date();
                        adbasadortrnx["type"] = "credit";

                        transactionsarray.push(adbasadortrnx);
                    });

                    let inserttrxns = await MarketPlaceTransactionsJournalModel.create(transactionsarray);

                    if(!inserttrxns) console.log("UNABLE TO CREATE MANY TRANSACTIONS FOR INFLUENCER CONTINUITY!");
                    if(!updatesystemwallet) console.log("CREDIT SYSTEM WALLET 2: ", updatesystemwallet);
                }

                let billbrandstarter = await MarketPlaceWalletModel.updateMany({premium: true, premiumuser: "BRAND", premiumstagecounter: {$lte: 3}, nextbillingdate: {$lt: new Date()}}, {$set: {lastbilledon: new Date, nextbillingdate: new Date(new Date().setHours(new Date().getHours() + (30*24)))}, $inc: {balance: -1 * brandstarter, stagecounter: 1}}).exec();

                if(billbrandstarter.nModified) {
                    let updatesystemwallet = await AdbasadorWallet.findOneAndUpdate({owner: "Adbasador"}, {$inc: {balance: brandstarter * billbrandstarter.nModified}, $set: {lastupdated: new Date()}} ).exec();

                    let eligiblebrandstarter = await MarketPlaceWalletModel.find({premium: true, premiumuser: "BRAND", premiumstagecounter: {$lte: 3}, nextbillingdate: {$lt: new Date()}}).exec();

                    let transactionsarray = [];

                    eligiblebrandstarter.forEach(trxn => {
                        let billtransactions = {}, adbasadortrnx = {};

                        billtransactions["txnref"] = uuid.v4();
                        billtransactions["amount"] = brandstarter;
                        billtransactions["title"] = "Premium monthly billing.";
                        billtransactions["brand"] = trxn.owner;
                        billtransactions["success"] = true;
                        billtransactions["createdon"] = new Date();
                        billtransactions["type"] = "debit";

                        transactionsarray.push(billtransactions);

                        adbasadortrnx["txnref"] = uuid.v4();
                        adbasadortrnx["amount"] = brandstarter;
                        adbasadortrnx["title"] = "Brand monthly billing.";
                        adbasadortrnx["system"] = "Adbasador";
                        adbasadortrnx["success"] = true;
                        adbasadortrnx["createdon"] = new Date();
                        adbasadortrnx["type"] = "credit";

                        transactionsarray.push(adbasadortrnx);
                    });

                    let inserttrxns = await MarketPlaceTransactionsJournalModel.create(transactionsarray);

                    if(!updatesystemwallet) console.log("CREDIT SYSTEM WALLET 3: ", updatesystemwallet);
                    if(!inserttrxns) console.log("UNABLE TO CREATE MANY TRANSACTIONS FOR BRAND STARTER!");
                }

                let billbrandcontinuity = await MarketPlaceWalletModel.updateMany({premium: true, premiumuser: "BRAND", premiumstagecounter: {$gt: 3}, nextbillingdate: {$lt: new Date()}}, {$set: {lastbilledon: new Date, nextbillingdate: new Date(new Date().setHours(new Date().getHours() + (30*24)))}, $inc: {balance: -1 * brandcontinuity}}).exec();

                if(billbrandcontinuity.nModified) {
                    let updatesystemwallet = await AdbasadorWallet.findOneAndUpdate({owner: "Adbasador"}, {$inc: {balance: brandcontinuity * billbrandcontinuity.nModified}, $set: {lastupdated: new Date()}} ).exec();

                    let eligiblebrandcontinuity = await MarketPlaceWalletModel.find({premium: true, premiumuser: "BRAND", premiumstagecounter: {$gt: 3}, nextbillingdate: {$lt: new Date()}}).exec();

                    let transactionsarray = [];

                    eligiblebrandcontinuity.forEach(trxn => {
                        let billtransactions = {}, adbasadortrnx = {};

                        billtransactions["txnref"] = uuid.v4();
                        billtransactions["amount"] = brandcontinuity;
                        billtransactions["title"] = "Premium monthly billing.";
                        billtransactions["brand"] = trxn.owner;
                        billtransactions["success"] = true;
                        billtransactions["createdon"] = new Date();
                        billtransactions["type"] = "debit";

                        transactionsarray.push(billtransactions);

                        adbasadortrnx["txnref"] = uuid.v4();
                        adbasadortrnx["amount"] = brandcontinuity;
                        adbasadortrnx["title"] = "Brand monthly billing.";
                        adbasadortrnx["system"] = "Adbasador";
                        adbasadortrnx["success"] = true;
                        adbasadortrnx["createdon"] = new Date();
                        adbasadortrnx["type"] = "credit";

                        transactionsarray.push(adbasadortrnx);
                    });

                    let inserttrxns = await MarketPlaceTransactionsJournalModel.create(transactionsarray);

                    if(!updatesystemwallet) console.log("CREDIT SYSTEM WALLET 4: ", updatesystemwallet);
                    if(!inserttrxns) console.log("UNABLE TO CREATE MANY TRANSACTIONS FOR BRAND CONTINUITY!");
                }

                console.log("BILLINFLUENCERSTARTER: ", billinfluencerstarter);
                console.log("BILLINFLUENCERCONTINUITY: ", billinfluencercontinuity);
                console.log("BILLBRANDSTARTER: ", billbrandstarter);
                console.log("BILLBRANDCONTINUITY: ", billbrandcontinuity);
            } else {
                console.log("No one to bill.");
            }
        } catch (error) {
            return res.status(500).json({error: error.message, message: 'Error while processing requests.'});
        }
    },

    getSeedList: async function(req, res) {

        try {
            let seedlist = await MarketPlaceSeedListsModel.findOne({name: req.params.name}, {"value" : true}).exec();

            return res.status(200).json({data: seedlist.value}); 
            
        } catch (error) {
            return res.status(500).json({
                message: 'Error when getting seed lists.', error: error.message});
        }
    },

    getComments: async function(req, res) {
        try {
            let advert = await AvailableAdsModel.findOne({_id: req.params.advert}).populate("owner").populate("comments.from").exec();
            if(!advert) return res.status(404).json({message: "Advert not found."});

            return res.status(200).json({data: advert});

        } catch (error) {
            return res.status(500).json({error: error.message, message: 'Error while processing requests.'});
        }
    },

    postComments: async function(req, res) {
        if(!req.body.type) return res.status(400).json({message: "Advert type required."});
        try {
            if(req.body.type === "available") {
                let advert = await AvailableAdsModel.findOne({_id: req.params.advert}).populate("owner").exec();
                if(!advert) return res.status(404).json({message: "Advert not found."});

                let commentbody = {"from" : req.body.from, comment: req.body.comment};

                let updateadvert = await AvailableAdsModel.findOneAndUpdate({_id: req.params.advert}, {$push: {"comments": commentbody}}).exec();

                if(!updateadvert) return res.status(500).json({message: "Unable to update advert."});

                return res.status(200).json({message: "Update successful!"});
            } else {
                let advert = await TrendingAdsModel.findOne({_id: req.params.advert}).populate("owner").exec();
                if(!advert) return res.status(404).json({message: "Advert not found."});

                let commentbody = {"from" : req.body.from, comment: req.body.comment};

                let updateadvert = await TrendingAdsModel.findOneAndUpdate({_id: req.params.advert}, {$push: {"comments": commentbody}}).exec();

                if(!updateadvert) return res.status(500).json({message: "Unable to update advert."});

                return res.status(200).json({message: "Update successful!"});
            }
            
        } catch (error) {
            return res.status(500).json({error: error.message, message: 'Error while processing requests.'});
        }
    },

    createSupport: async function (req, res) {
        if(!req.body.phonenumber) return res.status(400).json({message: "Phone number required."});
        if(!req.body.email) return res.status(400).json({message: "Email address is required."});
        if(!config.validateEmail(req.body.email)) return res.status(400).json({message: "Email address is not valid."});
        if(!req.body.subject) return res.status(400).json({message: "Subject is required."});
        if(!req.body.message) return res.status(400).json({message: "Message is required."});

        var Support = new MarketPlaceSupportModel({
            phonenumber : req.body.phonenumber,
            email : req.body.email,
            subject : req.body.subject,
            message : req.body.message,
        });

        Support.save(function (err, Sponsor) {
            if (err) {
                console.log("err: ", err)
                res.status(500).json({
                    message: 'Error when creating Support',
                    error: err
                });
            }

            let obj = {
                phonenumber: req.body.phonenumber,
                email: req.body.email,
                subject: req.body.subject,
                message: req.body.message
            }

            mailer.sendSupportMail(obj, config.supportmail);

            return res.status(200).json({message: "Support created!"});
        });
    }
}
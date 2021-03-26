var express = require('express');
var router = express.Router();
var MarketPlaceController = require('../controllers/marketplace/MarketPlaceController.js');
var InfluencerController = require('../controllers/marketplace/InfluencerController');
var BrandController = require('../controllers/marketplace/BrandController');
var AdminController = require('../controllers/marketplace/AdminController.js');

var middlewares = require("../utils/middleware.js");

router.post('/auth/login', MarketPlaceController.login); //check
router.get('/auth/getuser', middlewares.checkToken, MarketPlaceController.getUserDetails); //check
router.post('/auth/verify', MarketPlaceController.verifyToken); //check
router.post('/auth/verify/resend', MarketPlaceController.requestVerifyToken); //check

router.route('/ads/:type')
    .get(MarketPlaceController.listAds) //check
    .post(MarketPlaceController.filterAdvert) //check

router.get('/trending', MarketPlaceController.listTrendingAds);

router.post('/paystack/initiate', middlewares.checkToken, MarketPlaceController.initiatePaystackTransaction); //check

router.post('/paystack/confirm', MarketPlaceController.confirmAndLogPayEvents); //check

router.route('/influencer')
    .post(InfluencerController.createInfluencer) //check
    .get(MarketPlaceController.listInfluencers)
    .put(middlewares.checkToken, InfluencerController.updateInfluencer);

router.route('/advert/proposal/:proposal')
    .get(middlewares.checkToken, InfluencerController.getProposalbyId);

router.route('/advert/comments/:advert')
    .get(middlewares.checkToken, MarketPlaceController.getComments)
    .post(middlewares.checkToken, MarketPlaceController.postComments)

router.route('/advert/proposal/:status/:id')
    .post(middlewares.checkToken, BrandController.updateProposal)
    .get(middlewares.checkToken, BrandController.listInfluencerProposals);

router.route('/advert/confirmation/:proposal')
    .post(middlewares.checkToken, BrandController.rejectInfluencerAdvertConfirmation)
    .get(middlewares.checkToken, BrandController.acceptInfluencerAdvertConfirmation);

router.route('/advert/apply/:id')
    .post(middlewares.checkToken, InfluencerController.applyForAdvertCampaign)
    .get(MarketPlaceController.fetchAdvertInfluencers);

router.route("/advert/notifications/:owner")
    .get(middlewares.checkToken, MarketPlaceController.listNotifications) //check.
    .post(middlewares.checkToken, MarketPlaceController.markNotificationRead);

router.route('/advert/insight/:proposal')
    .post(middlewares.checkToken, InfluencerController.submitInsight)
    .put(middlewares.checkToken, BrandController.rateInsight)

router.route('/brand')
    .post(BrandController.createBrand) //check
    .put(middlewares.checkToken, BrandController.updateBrand)

router.post('/brand/create', middlewares.checkToken, BrandController.createAvailableAd); //check

router.route('/brand/campaigns/:id')
    .get(middlewares.checkToken, MarketPlaceController.listBrandAds)
    .post(middlewares.checkToken, BrandController.listEligibleInfluencers);

router.route('/brand/upgrade')
    .post(middlewares.checkToken, BrandController.upgradeBrandLevel);

router.route('/brand/updateinsight')
    .post(middlewares.checkToken, middlewares.checkToken, BrandController.rejectInsight);

router.post('/brand/tour/show', middlewares.checkToken, BrandController.toggleTour);

router.get('/users/insight/:id', middlewares.checkToken, BrandController.usersUploadInsights);

router.get('/:id/vote/:status', middlewares.checkToken, MarketPlaceController.vote);

router.get('/downloads/:id', middlewares.checkToken, MarketPlaceController.countDownloads);

router.get('admin/makeavailable/:id', middlewares.checkToken, MarketPlaceController.makeTrendingAdAvailable);

router.get('/:id/view/:type', MarketPlaceController.view);

router.get('/ads/:type/:id', MarketPlaceController.getCampaignById);

router.get('/influencer/:id', MarketPlaceController.getInfluencer);

router.route('/influencer/vip/list')
    .get(MarketPlaceController.getVipInfluencers)
    .post(middlewares.checkToken, InfluencerController.upgradeInfluencerLevel)

router.post('/influencer/accept', middlewares.checkToken, BrandController.acceptProposals);

router.post('/influencer/reject/ad', middlewares.checkToken, InfluencerController.rejectAdvert);

router.post('/influencer/filter', MarketPlaceController.filterInfluencers);

router.route('/influencer/gallery')
    .post(middlewares.checkToken, InfluencerController.addToGallery);

router.get('/influencer/gallery/:user', InfluencerController.getInfluencerGallery)

router.post('/influencer/advert/:proposal', middlewares.checkToken, InfluencerController.submitAdvertConfirmation);

router.post('/influencer/airtime/purchase', middlewares.checkToken, InfluencerController.purchaseAirtime);

router.post('/influencer/airtime/confirm', InfluencerController.confirmAirtimePurchase);

router.get('/influencer/history/campaign', middlewares.checkToken, InfluencerController.influencerCampaignHistory);

router.post('/requestpasswordreset', MarketPlaceController.requestPasswordReset);

router.get('/resetpassword/:id', MarketPlaceController.resetPassword);

router.post('/resetpassword/:id', MarketPlaceController.changePassword);

router.get('/wallet/:id/:owner', middlewares.checkToken, MarketPlaceController.getWalletBalance);

router.get('/ledger/:id/:owner', middlewares.checkToken, MarketPlaceController.getLedgerBalance);

router.post('/transactions/:id', middlewares.checkToken, MarketPlaceController.getTransactionHistory);

router.get('/platforms/authorize', MarketPlaceController.handleSocialMediaAuth);

router.get('/seedlists/:name', MarketPlaceController.getSeedList);

router.post('/support/create', MarketPlaceController.createSupport);

router.post('/admin', AdminController.createAdmin);

router.post('/admin/auth/login', AdminController.login);

router.post('/admin/create', middlewares.checkToken, AdminController.createTrendingAd);

router.post('/admin/socialmedia/update', middlewares.checkToken, AdminController.submitInfluencerEngagement);

router.get('/admin/brandsignups', middlewares.checkToken, AdminController.getBrandSignUpStatistics);

router.get('/admin/influencersignups', middlewares.checkToken, AdminController.getInfluencerSignUpStatistics);

router.get('/admin/systemstatistics', middlewares.checkToken, AdminController.getSystemStatistics);

router.get('/admin/listinfluencers', middlewares.checkToken, AdminController.listInfluencers);

router.get('/admin/approveidentity/:email', middlewares.checkToken, AdminController.approveIdentity);

router.post('/admin/rejectidentity/:email', middlewares.checkToken, AdminController.rejectIdentity);

router.use(function(req, res) {
    return res.status(404).send({ message: 'The url you visited does not exist' });
});

module.exports = router;
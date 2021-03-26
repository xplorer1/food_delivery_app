module.exports = {
    'port': process.env.PORT || 8050,

    'baseurl': "",
    'database' : "",

    'secret': 'JLH260TYRI8ACR5S3SBKKDMF1KQH77245LMORMEM3WD95PNGB3V0PHKXNWH6B47TDAS5C2PDVOO77URYVYWBAHKK0LKIS4L30L7U',
    generateCode: function (len) {
        var length = len,
            charset = "01234567890ABCDEFGHIJKLMNOPQRSTUVWXY",
            retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    },

    validateEmail: function (email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },

    checkImageSize: function (img) {
        const buffer = Buffer.from(img.substring(img.indexOf(',') + 1));
        
        return buffer.length/1e+6;
    }

    //This application should be able to form a bridge between restaurants and consumers. 
    //Restaurants owners must be able to sign up and list out their food items along with the price. 
    //Users must be able to sign up, view the restaurants nearby and order food items from selected restaurants.
    //Restaurants should accept the order and assign a delivery person to the order. 
    //The location of the delivery person and the dynamic ETA of delivery must be displayed to the user who ordered food. 
    //The cart and payment page must be unique across the full application. 
}
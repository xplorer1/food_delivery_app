const storage = require('node-persist');

const appstorage = {
    set: function(settingname, settingvalue){
        storage.initSync();

        try{
            storage.setItemSync(settingname, JSON.stringify(settingvalue));
        }catch(err){
            console.log('storage error:', err.message, 'settingvalue', settingvalue);
        }            
    },

    get: function(settingname){
        storage.initSync();

        var result = storage.getItemSync(settingname);
        if(result) result = JSON.parse(result);

        return result
    },

    remove: function(settingname){
        storage.initSync();

        storage.removeItemSync(settingname);
    }
}
    
module.exports = appstorage;
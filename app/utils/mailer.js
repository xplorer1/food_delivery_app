let nodemailer = require('nodemailer');
let mailtemplates = require("./mailtemplates");
var config = require('../../config');

let transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
        user: "",
        pass: ""
    }
});

module.exports = {
    sendEmailVerificationMail: function sendEmailVerificationMail(name, confirmlink, recipient){

        let mailOptions = {
            from: '"Hello From Adbasador Plus"<noreply@adbasador.com>',
            cc: config.supportmail,
            to: recipient,
            subject: prefix + 'Welcome to Adbasador Plus',
            text: 'Hello ' + name + '! Please Thank you for choosing Adbasador Plus. click on the link below to active your email address. ',
            html: 'Hello ' + name + '!<br><br>Thank you for choosing Adbasador Plus. We are pleased to have you on board. ' +
            '<br><br>To activate your account, click or copy the link below to your browser. ' +
            '<br><br><a  target="_blank" href="' + confirmlink + '">' + confirmlink + '</a>'
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log('Error: ', error, ' : ', new Date());
            }
        });
    }
};
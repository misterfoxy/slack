const Botkit = require('botkit')
const axios = require('axios');
require('dotenv').config()

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.PORT || !process.env.VERIFICATION_TOKEN) {
    console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN and PORT in environment');
    process.exit(1);
  } else {
    console.log('Good job, you have the variables!')
  }

  // instantiate controller and file  store
const controller = Botkit.slackbot({
    json_file_store: './db_slackbutton_slash_command/',
    debug: true,
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
})

// configure bot with unique env and permissions
controller.configureSlackApp({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
    scopes: ['admin','commands', 'bot'],
})

// instantiate bot user
var bot = controller.spawn({
    token: process.env.BOT_TOKEN,
    incoming_webhook: {
      url: 'https://hooks.slack.com/services/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'
    }
  }).startRTM();

  // instnatiate webserver
  controller.setupWebserver(process.env.PORT, function(err, webserver){
    controller.createWebhookEndpoints(controller.webserver);
    controller.createOauthEndpoints(controller.webserver, 
      function(err, req, res) {
        if (err) {
          res.status(500).send('ERROR: ' + err);
        } else {
          res.send('Success!');
        }
      });
   });

// test

controller.hears('hi', 'direct_message', (bot, message) => {
    bot.reply(message, 'Hello.')
})

// create slash_command for opening dialog
controller.on('slash_command', (bot, message) => {
    // prevent timeout
    bot.replyAcknowledge()
    var dialog = bot.createDialog(
        'Create new Issue',
        'issue',
        'Submit'
      ).addSelect('What section are you working on?','select',null,[{label:'splurty',value:'splurty'},{label:'nomster',value:'nomster'},{label:'flixter',value:'flixter'},{label:'tdd',value:'tdd'},{label:'spa',value:'spa'}],{placeholder: 'Select One'})
       .addTextarea('Issue Description','textarea')
       .addUrl('Github URL','url');
    
       bot.replyWithDialog(message, dialog.asObject());
})

// controller.hears('webhook', 'direct_message', (bot, message) => {
//     bot.sendWebhook({
//       text: message.text
//     },function(err,res) {
//       if (err) {
//         console.log('web err', err)
//       }
//     });
//   });

controller.on('dialog_submission', (bot, message) => {
    bot.replyAcknowledge()

    axios.post('https://hooks.slack.com/services/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', {
        text: message.submission.textarea
    })
    .then(data => {
        bot.reply(message, 'ok!')
    })
    .catch(err => {
        console.error(err)
    })

    

})


// GOOD URLS
// incoming webhook https://hooks.slack.com/services/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
// interactive request: https://48295d36.ngrok.io/slack/receive
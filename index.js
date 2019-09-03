const Botkit = require('botkit')
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
    scopes: ['commands', 'bot'],
})

// instantiate bot user
const bot = controller.spawn({
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

controller.on('slash_command', (bot, message) => {
    bot.replyAcknowledge()
    // switch(message.command){
    //     case "/tutorbot":
    //         bot.reply(message, 'heard ya!')
    //         break;
    //     default:
    //         bot.reply(message, 'Did not recognize that')
    // }
    var dialog = bot.createDialog(
        'Create new Issue',
        'issue',
        'Submit'
      ).addText('Text','text','some text')
       .addSelect('Select','select',null,[{label:'Foo',value:'foo'},{label:'Bar',value:'bar'}],{placeholder: 'Select One'})
       .addTextarea('Textarea','textarea','some longer text',{placeholder: 'Put words here'})
       .addUrl('Github URL','url');
    
       bot.replyWithDialog(message, dialog.asObject());
})

controller.hears('webhook', 'direct_message', (bot, message) => {
    bot.sendWebhook({
      text: message.text
    },function(err,res) {
      if (err) {
        console.log('web err', err)
      }
    });
  });
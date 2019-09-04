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
    scopes: ['admin','commands', 'bot','channels:history', 'channels:read','emoji:read', 'users.profile:read', 'chat:write:user'],
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
       .addText('What lesson number are you on?', 'num')
       .addTextarea('Issue Description','textarea')
       .addUrl('Github URL','url');
    
       bot.replyWithDialog(message, dialog.asObject());
})

// validation middleware
controller.middleware.receive.use(function validateDialog(bot, message, next) {


    if (message.type=='dialog_submission') {
  
      if (message.submission.url == null) {
         bot.dialogError({
            "name":"url",
            "error":"You must include a valid github URL"
            });            
        return;
      }
      else if(message.submission.select == null) {
        bot.dialogError({
           "name":"select",
           "error":"You must tell us the project you're working on"
           });            
       return;
     }
     else if(message.submission.textarea == null) {
        bot.dialogError({
           "name":"select",
           "error":"You provide a description"
           });            
       return;
     }
    }
  
    next();
  
  });

    /* 

        TUTOR BOT!!!

        ACTIVAAAAAATE!!!!


    */

controller.on('dialog_submission', (bot, message) => {
    bot.replyAcknowledge()

    let CHANNEL_ID;

    // use selectfield to choose webhook for specific channel
    switch(message.submission.select){
        case 'splurty':
            CHANNEL_ID = process.env.SPLURTY_ID
            break;
        case 'nomster':
            CHANNEL_ID = process.env.NOMSTER_ID
            break;
        default:
            CHANNEL_ID=process.env.DEV_TEMP_CHANNEL_ID
    }


    axios.post(`https://slack.com/api/chat.postMessage?token=${process.env.BOT_TOKEN}&channel=${CHANNEL_ID}&text=${message.submission.textarea}`,{
       
        // attachments:[
        //     {
        //         "fallback": "Required plain-text summary of the attachment.",
        //         "color": "#2eb886",
        //         // "pretext": "Optional text that appears above the attachment block",
        //         "author_name": "GitHub URL",
        //         "fields": [
        //             {
        //             "title": "Lesson Number",
        //             "value": message.submission.num,
        //             "short": true,
        //             }
        //         ],
        //         "author_link": "https://" + message.submission.url,
        //         "author_icon": "http://flickr.com/icons/bobby.jpg",
        //         "title": message.submission.textarea,
        //         // "title_link": "https://api.slack.com/",
        //         "text": message.submission.url,
        //         // "image_url": "http://my-website.com/path/to/image.jpg",
        //         // "thumb_url": "http://example.com/path/to/thumb.png",
        //         "footer": "made with <3 by misterfoxy",
        //         "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
        //         "ts": Date.UTC()
        //     }
        // ]
    })
    .then(data => {
        const message_id = data.data.ts
        const channel = data.data.channel

        // grab permalink of the post
        axios.get(`https://slack.com/api/chat.getPermalink?token=${process.env.OAUTH_ACCESS_TOKEN}&channel=${channel}&message_ts=${message_id}`)
        .then(data => {

            // post to TA queue with permalink
                axios.post(process.env.TA_QUEUE_WEBHOOK, {
                    blocks:[
                        {
                            "type": "section",
                            "text": {
                                "text": data.data.permalink,
                                "type": "mrkdwn"
                            }
                        },
                        {
                            "type": "actions",
                            "elements": [
                                
                                {
                                    "type": "button",
                                    "text": {
                                        "type": "plain_text",
                                        "text": "Claim",
                                        "emoji": true
                                    },
                                    "value": "click_me_123"
                                }
                            ]
                        }
                    ]
                })
                .then(data => {
                    console.log(data)

                })
                .catch(err => {
                    console.error(err)
                })
        })
        .catch(err => {
            console.error(err)
         })
    }) 
    .catch(err => {
       console.error(err)
    })
  
})



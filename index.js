const myDotEnv = require('dotenv');
const Botkit = require('botkit');
const controller = Botkit.slackbot({
  json_file_store: './db_slackbutton_bot/',
  interactive_replies: true
})

myDotEnv.config();
controller.configureSlackApp(
  {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['bot'],
  }
);

controller.setupWebserver(process.env.PORT, (err,webserver) => {
  controller.createWebhookEndpoints(controller.webserver);
  controller.createOauthEndpoints(controller.webserver, (err,req,res) => {
    if (err) {
      res.status(500).send('ERROR: ' + err);
    } else {
      res.send('Success!');
    }
  });
});

// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};
function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

// Handle events related to the websocket connection to Slack
controller.on('rtm_open',(bot) => {
  bot.startPrivateConversation({user: 'U2D7ARY10'}, function(response, convo){
    convo.ask({
      attachments: [
        {
          text: "Appetizer",
          fallback: "You are unable to choose an Appetizer",
          callback_id: "appetizer_id",
          color: "#3AA3E3",
          attachment_type: "default",
          actions: [
            {
              name: "Ensalada",
              text: "Ensalada",
              type: "button",
              value: "ensalada"
            },
            {
              name: "Tequeños",
              text: "Tequeños",
              type: "button",
              value: "tequeños"
            },
            {
              name: "Causa",
              text: "Causa",
              type: "button",
              value: "causa"
            }
          ]
        },
        {
          text: "Entree",
          fallback: "You are unable to choose an Entree",
          callback_id: "entree_id",
          color: "#DEB24E",
          attachment_type: "default",
          actions: [
            {
              name: "Arroz con Pollo",
              text: "Arroz con Pollo",
              type: "button",
              value: "arroz_pollo"
            },
            {
              name: "Lomo Saltado",
              text: "Lomo Saltado",
              type: "button",
              value: "lomo_saltado"
            },
            {
              name: "Pollo al Sillao",
              text: "Pollo al Sillao",
              type: "button",
              value: "pollo_sillao"
            }
          ]
        },
        {
          text: "Not eating today",
          fallback: "You are unable to choose this selection",
          callback_id: "none_id",
          color: "#DE4E4E",
          attachment_type: "default",
          actions: [
            {
              name: "Not eating today",
              text: "Not eating today",
              type: "button",
              style: "danger",
              value: "not_eating"
            }
          ]
        }
      ]
    });

  })
});

controller.on('rtm_close',() => console.log('** The RTM api just closed'));

controller.on(['direct_message','mention','direct_mention'], (bot,message) => {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name: 'robot_face',
  }, (err) => {
    if (err) { console.log(err) }
    bot.reply(message,'I heard you loud and clear boss.');
  });
});

controller.storage.teams.all((err,teams) => {
  if (err) {
    throw new Error(err);
  }
  // connect all teams with bots up to slack!
  for (var t  in teams) {
    if (teams[t].bot) {
      controller.spawn(teams[t]).startRTM(function(err, bot) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }
});

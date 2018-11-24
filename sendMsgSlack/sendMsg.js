var request = require('request');

var timestamp = new Date();

request.post(
    'https://hooks.slack.com/services/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',
    { json: { text: timestamp } },
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // console.log(body);
            if (body == 'ok'){
              console.log('msg');
            }
        }
    }
);

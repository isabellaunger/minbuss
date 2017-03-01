var express = require('express');
var app = express();
var request = require('request');


function dateFormat (date, fstr, utc) {
  utc = utc ? 'getUTC' : 'get';
  return fstr.replace (/%[YmdHMS]/g, function (m) {
    switch (m) {
    case '%Y': return date[utc + 'FullYear'] (); // no leading zeros required
    case '%m': m = 1 + date[utc + 'Month'] (); break;
    case '%d': m = date[utc + 'Date'] (); break;
    case '%H': m = date[utc + 'Hours'] (); break;
    case '%M': m = date[utc + 'Minutes'] (); break;
    case '%S': m = date[utc + 'Seconds'] (); break;
    default: return m.slice (1); // unknown code, remove %
    }
    // add leading zero if required
    return ('0' + m).slice (-2);
  });
}


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {

    request({
        url: 'https://api.vasttrafik.se/token',
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + process.env.VTBASICAUTH
        },
        body: 'grant_type=client_credentials&scope=device_1'
    }, function(error, response, body) {
        if (error) {
            console.log(error);
        } else {

            var jsonBody = JSON.parse(body);
            console.log(jsonBody.access_token);

            var time = dateFormat(new Date(), "%H:%M", false);
            var date = dateFormat (new Date(), "%Y-%m-%d", false);

            request({
                url: 'https://api.vasttrafik.se/bin/rest.exe/v2/departureBoard',
                qs: {
                    id: '9021014013711000',
                    date: date, 
                    time: time,
                    format: 'json'
                }, 
                method: 'GET', 
                headers: { 
                    'Authorization': 'Bearer ' + jsonBody.access_token
                }
            }, function(error, response, body) {
                if (error) {
                    console.log(error);
                } else {
                    var jsonBody = JSON.parse(body);
                    var output = "<h1>Min buss</h1>"

                    for(var i = 0 ; i < jsonBody.DepartureBoard.Departure.length ; i++) {
                        var dep = jsonBody.DepartureBoard.Departure[i];

                        output += dep.name + " mot " + dep.direction + " kl: " + dep.time + "<br>"
                    }

                    res.send(output);
                }
            });
        }
    });
    
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
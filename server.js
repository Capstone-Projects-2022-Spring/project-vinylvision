var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var serverPORT = 8888

var projectUrl = 'http://localhost:8888';
const spotify = require('./spotify.js');
const fs = require('fs');

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

html = {
    render(path, response) {
        fs.readFile(path, null, function (error, data) {
            if (error) {
                response.writeHead(404);
                respone.write('file not found');
            } else {
                response.write(data);
            }
            response.end();
        });
    }
}

//spotify player homepage
app.get('/spotify', function (req, res) {
    html.render('./public/spotify-player.html', res);
});

//req: request, res: response
//send to spotify's site to authorize user with options to return to vinylvision site
app.get('/spotify/login', function (req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    res.redirect('https://accounts.spotify.com/authorize?' +
        spotify.getAuthQueryString(state));
});

//send to spotify's site to authorize user with options to return to vinylvision site
app.get('/spotify/logout', function (req, res) {
    res.redirect('/');
});

//callback redirection function
app.get('/spotify/callback', function (req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) { //state mismatch error
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            })); //put in url state_mismatch
    } else {
        res.clearCookie(stateKey);
        var authOptions = spotify.getAuthOptions(code);

        request.post(authOptions, function (error, response, body) { //access token request
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function (error, response, body) {
                    console.log(body);
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect(projectUrl + '/spotify/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            } else { //response failure
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    })); //put invalid_token in url
            }
        });
    }
});

//return access token
app.get('/spotify/token', (req, res) => {
    res.json({
        access_token: access_token
    })
})

//refresh access token
app.get('/spotify/refresh_token', function (req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = spotify.getAuthOptionsRefresh(refresh_token)

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) { //response success
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

console.log('Listening on ' + serverPORT);
//app.createServer(router.handleRequest).listen(serverPORT);
app.listen(serverPORT);
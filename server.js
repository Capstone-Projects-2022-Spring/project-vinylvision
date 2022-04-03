var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const fs = require('fs');

require('dotenv').config(); //for loading from env file
var serverPORT = process.env.PORT
var projectUrl = process.env.PROJECT_URL;
const spotify = require('./spotify.js');

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

var guessVar = "";

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

function parseQueryString(query) {
    var parsed = {};

    query.replace(
        new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
        function ($0, $1, $2, $3) {
            parsed[decodeURIComponent($1)] = decodeURIComponent($3);
        }
    );

    return parsed;
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

//send to spotify's site and check for has parameter in the format /spotify/login/:search?guess=someResponse
app.get('/spotify/login/:search', function (req, res) {

    guessVar = req.query.guess //store guess to send to redirect

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    res.redirect('https://accounts.spotify.com/authorize?' +
        spotify.getAuthQueryString(state));
});

//send to spotify's site to authorize user with options to return to vinylvision site
app.get('/spotify/logout', function (req, res) {
    res.clearCookie('spotifyAccessToken');
    res.clearCookie('spotifyRefreshToken');
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

                spotify.setCookies(res, body) //store cookies for access and refresh token

                if (guessVar != "") { //send guess to redirect
                    res.redirect(projectUrl + '/spotify#guess=' + guessVar);
                }else { //in case there's no guess
                    res.redirect(projectUrl + '/spotify');
                }
                
            } else { //response failure
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    })); //put invalid_token in url
            }
        });
    }
});

//refresh access token
app.get('/spotify/refresh_token', function (req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    //console.log(refresh_token)
    var authOptionsRefresh = spotify.getAuthOptionsRefresh(refresh_token);

    request.post(authOptionsRefresh, function (error, response, body) {
        if (!error && response.statusCode === 200) { //response success
            //var access_token = body.access_token;
            spotify.setCookies(res,body)
            /*res.send({
                'access_token': access_token
            });*/
            res.send({
                'response': 'success'
            })
        }
    });
});

console.log('Listening on ' + serverPORT);
//app.createServer(router.handleRequest).listen(serverPORT);
app.listen(serverPORT);
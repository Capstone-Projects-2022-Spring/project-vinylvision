var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var path = require('path') //for sending files

require('dotenv').config(); //for loading from env file
var projectUrl = process.env.PROJECT_URL;
const spotify = require('./spotify.js');

const functions = require('firebase-functions') //for firebase functions

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
var songVar = "";

//var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

//spotify player homepage
app.get('/spotify', function (req, res) {
    res.status(200).sendFile(path.join(__dirname, '/views/spotify-player.html'))
});

var state

//req: request, res: response
//send to spotify's site to authorize user with options to return to vinylvision site
app.get('/spotify/login', function (req, res) {

    state = generateRandomString(16);
    //res.cookie(stateKey, state);

    // your application requests authorization
    res.redirect('https://accounts.spotify.com/authorize?' +
        spotify.getAuthQueryString(state));
});


//send to spotify's site and check for has parameter in the format /spotify/login/:search?guess=someResponse
app.get('/spotify/login/:searchsong', function (req, res) {

    guessVar = req.query.guess //store guess to send to redirect
    songVar = req.query.song //store song to send to redirect

    state = generateRandomString(16);

    // your application requests authorization
    res.redirect('https://accounts.spotify.com/authorize?' +
        spotify.getAuthQueryString(state));
});

//send to spotify's site and check for has parameter in the format /spotify/login/:search?guess=someResponse
app.get('/spotify/login/:search', function (req, res) {

    guessVar = req.query //store guess to send to redirect
    songVar = ""

    state = generateRandomString(16);
    //res.cookie(stateKey, state);

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
    //var state = req.query.state || null;
    //var storedState = req.cookies ? req.cookies[stateKey] : null;

    // || state !== storedState
    if (state === null) { //state mismatch error
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            })); //put in url state_mismatch
    } else {
        //res.clearCookie(stateKey);
        var authOptions = spotify.getAuthOptions(code);

        request.post(authOptions, function (error, response, body) { //access token request
            if (!error && response.statusCode === 200) {

                spotify.setCookies(res, body) //store cookies for access and refresh token

                if (guessVar != "") { //send guess to redirect
                    var redirect = projectUrl + '/spotify#guess=' + encodeURIComponent(guessVar)
                    if (songVar != "") {
                        redirect += '&song=' + encodeURIComponent(songVar)
                    }
                    res.redirect(redirect);
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
            var access_token = body.access_token;
            spotify.setCookies(res, body)
            res.send({
                'access_token': access_token
            });
        }
    });
});

//console.log('Listening on ' + serverPORT);
//app.createServer(router.handleRequest).listen(serverPORT);
//app.listen(serverPORT);

//export app for firebase to see and handles requests from url
exports.app = functions.https.onRequest(app)
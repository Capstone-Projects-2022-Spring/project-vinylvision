var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var path = require('path') //for sending files

require('dotenv').config(); //for loading from env file
var serverPORT = process.env.PORT_NUM
var projectUrl = process.env.PROJECT_URL;
const spotify = require('./spotify.js');

const functions = require('firebase-functions')

//firebase
//const firebase = require('firebase')
//const admin = require('firebase-admin');
//const serviceAccount = require("../serviceAccountKey.json");
/*const firebaseConfig = {
    apiKey: "AIzaSyDFevAaht4vZVZ7OKJ9lut6F8xxPBG5LJs",
    authDomain: "tu-vinylvision.firebaseapp.com",
    databaseURL: "https://tu-vinylvision-default-rtdb.firebaseio.com",
    projectId: "tu-vinylvision",
    storageBucket: "tu-vinylvision.appspot.com",
    messagingSenderId: "13874989434",
    appId: "1:13874989434:web:7de2a9ed0d216ca7896ec3",
    measurementId: "G-SZEDZEHBLE"
};*/
//const db = firebase.initializeApp(firebaseConfig)
/*admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});*/
//module.exports = db;
//let database = firebase.database()

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
app.get('/spotify/login/:search', function (req, res) {

    guessVar = req.query.guess //store guess to send to redirect

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

exports.app = functions.https.onRequest(app)
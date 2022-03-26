//var querystring = require('querystring');
//require('dotenv').config(); //for loading from env file
//import 'dotenv/config'

var client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
var client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
var redirect_uri = process.env.PROJECT_URL + '/spotify/callback'; // Your redirect uri

var scope = 'user-read-private user-read-email'; //permissions

function setCookies(res, data) {
    let spotifyAccessOptions = {
        // Spotify sends token in seconds, express wants milliseconds
        // remove 5 seconds to avoid race conditions.
        maxAge: (data.expires_in - 5) * 1000
    }
    res.cookie('spotifyAccessToken', data.access_token, spotifyAccessOptions);
    if (data.refresh_token) {
        res.cookie('spotifyRefreshToken', data.refresh_token);
    }
}

function getAuthOptions(code) { //access token authorization options
    return {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: { //HTTP headers
            'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
    }
}

function getAuthOptionsRefresh(refresh_token) { //refresh access token options
    return {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    }
}

function getAuthQueryString(state) { //login & redirection options
    return JSON.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    })
}

module.exports = { //for external use of functions
    setCookies: setCookies,
    getAuthOptions: getAuthOptions,
    getAuthOptionsRefresh: getAuthOptionsRefresh,
    getAuthQueryString: getAuthQueryString
}
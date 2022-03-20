var querystring = require('querystring');
require('dotenv').config(); //for loading from env file

var client_id = process.env.SPOTIFY_CLIENT_ID; // Your client id
var client_secret = process.env.SPOTIFY_CLIENT_SECRET; // Your secret
var redirect_uri = process.env.PROJECT_URL + '/spotify/callback'; // Your redirect uri

var scope = 'user-read-private user-read-email'; //permissions

/**
  * Obtains parameters from the hash of the URL
  * @return Object
  */
function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
}

function searchAlbums(query) {
    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: query,
            type: 'album'
        },
        headers: {
            'Authorization' : 'Bearer' + getHashParams()
        },
        success: function (response) {
            resultsPlaceholder.innerHTML = template(response);
        }
    });
};

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
    return querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    })
}

module.exports = { //for external use of functions
    searchAlbums: searchAlbums,
    setCookies: setCookies,
    getAuthOptions: getAuthOptions,
    getAuthOptionsRefresh: getAuthOptionsRefresh,
    getAuthQueryString: getAuthQueryString
}
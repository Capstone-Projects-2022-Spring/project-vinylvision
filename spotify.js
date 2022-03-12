var querystring = require('querystring');

var client_id = 'd0525be4c5f740699430e39162f29ca4'; // Your client id
var client_secret = '846a8c90ce324b1cae5596c150585d64'; // Your secret
var redirect_uri = 'http://localhost:8888/spotify/callback'; // Your redirect uri

var scope = 'user-read-private user-read-email'; //permissions

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
    getAuthOptions: getAuthOptions,
    getAuthOptionsRefresh: getAuthOptionsRefresh,
    getAuthQueryString: getAuthQueryString
}
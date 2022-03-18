var querystring = require('querystring');

var client_id = 'd0525be4c5f740699430e39162f29ca4'; // Your client id
var client_secret = '846a8c90ce324b1cae5596c150585d64'; // Your secret
var redirect_uri = 'http://localhost:8888/spotify/callback'; // Your redirect uri

var scope = 'user-read-private user-read-email'; //permissions

/*function callApi(method, url, body, callback, access_token) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function search() {
    return callApi("GET", )
}*/

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
    getAuthOptions: getAuthOptions,
    getAuthOptionsRefresh: getAuthOptionsRefresh,
    getAuthQueryString: getAuthQueryString
}
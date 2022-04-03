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

//get cookie with name cname
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

var albumSearches = null

//search for an album with the tags from query
function searchAlbums(query) {
    if (query == "") return; //if empty, can require search tags, but dont need to
    //console.log(getCookie('spotifyAccessToken'))

    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: query,
            type: 'album',
            limit: 10
        },
        headers: {
            'Authorization': 'Bearer ' + getToken()
        },
        success: function (response) {
            //console.log(response.albums)
            albumSearches = response.albums.items
            i = 0; //reset position in albumSearches array
            //display the top result
            if (albumSearches[0]) {
                document.getElementById("search_error").innerHTML = "<br>"
                displayAlbum(albumSearches[0])
            }
            else {
                removeAlbum()
                document.getElementById("search_error").innerHTML = "<font color='red'>No search results found!</font>"
            }
        }
    });
};

var i = 0;

//i is the current position in the albumSearches array
//j can increase or decrease this number
//this function will display albums in the player from the albumSearches array
function nextSearchResult(j) {
    //albumSearches exists and bounds of i: 0-4
    if (albumSearches && (0 <= (i + j) && (i + j) < 10)) {
        i += j
        if (albumSearches[i]) { //if theres even enough search results (ive never caught this error)
            displayAlbum(albumSearches[i])
        }
        else { //if there's not a result, revert the change
            i -= j
        }
    }
}

function displayAlbum(album) {
    //console.log(album)
    //console.log(album.name)
    document.getElementById("imageDiv").innerHTML = `<img src=${album.images[1].url} alt='${album.name} Album Cover' width='200px' height='200px'>`

    //add album name
    var albumNameDiv = document.getElementById("album_name")
    albumNameDiv.value = album.name
    albumNameDiv.dataset.uri = album.uri //add uri (), this is used for play() (unused)
    albumNameDiv.dataset.url = album.external_urls.spotify //add url, this is opened when using "openTrack"

    //add artist names
    var artistDiv = document.getElementById("artist")
    artistDiv.value = album.artists[0].name
    document.getElementById("artist_text").innerHTML = "Artist:"
    for (let i = 1; i < album.artists.length; i++) {
        document.getElementById("artist_text").innerHTML = "Artists:"
        artistDiv.value += ", " + album.artists[i].name
    }

    //then fetch the tracks
    fetchTracks(album.id)
}

function fetchTracks(albumId) {
    $.ajax({
        url: 'https://api.spotify.com/v1/albums/' + albumId + '/tracks',
        data: {
            limit: 50
        },
        headers: {
            'Authorization': 'Bearer ' + getToken()
        },
        success: function (response) {
            //console.log(response)
            //add tracks to dropdown
            var tracksDiv = document.getElementById("tracks")
            tracksDiv.innerHTML = null
            var tracks = response.items
            for (let i = 0; i < tracks.length; i++) {
                //console.log(response.items[i].name)
                //tracks.innerHTML += `<option value=${i}>` + response.items[i].name + '</option>'
                tracksDiv.innerHTML += `<option value=${tracks[i].external_urls.spotify}>` + tracks[i].name + '</option>'
            }
            //play(accessToken)
        }
    });
};

function playAlbum() {
    var dataUrl = document.getElementById("album_name").getAttribute("data-url")
    if (dataUrl) {
        window.open(dataUrl, "_blank")
    }
}

function playTrack() {
    var dataUrl = document.getElementById("tracks").value
    if (dataUrl) {
        window.open(dataUrl, "_blank")
    }
}

function removeAlbum() {
    document.getElementById("imageDiv").innerHTML = null

    var albumNameDiv = document.getElementById("album_name")
    albumNameDiv.value = ""
    albumNameDiv.dataset.uri = ""
    albumNameDiv.dataset.url = ""

    document.getElementById("artist").value = null
    removeTracks()
}

function removeTracks() {
    document.getElementById("tracks").innerHTML = null
}

function getToken() {
    if (getCookie('spotifyAccessToken')) { //if token exists
        return getCookie('spotifyAccessToken')
    }
    else {
        //refresh the token
        return refreshToken()
    }
}

function refreshToken() {
    //calls the node.js refresh token code that calls spotify's api
    $.ajax({
        type: 'GET',
        url: '/spotify/refresh_token',
        data: {
            refresh_token: getCookie('spotifyRefreshToken')
        },
        success: function (data) {
            return getCookie('spotifyAccessToken')
        }
    })
}
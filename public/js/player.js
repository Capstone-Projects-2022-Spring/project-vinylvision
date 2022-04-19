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
var i = 0;

//search for an album with the tags from query
async function searchAlbums(query) {
    document.getElementById("search_error").innerHTML = "<br>"
    if (query == "") { //if empty, can require search tags, but dont need to
        if (document.getElementById('search_tags2').value != "") {
            document.getElementById("search_error").innerHTML = `<font color='red'>Song Search not supported! Please fill in Album Guess.</font>`
        } else {
            document.getElementById("search_error").innerHTML = `<font color='red'>Album Guess required!</font>`
        }
        return;
    }
    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: query,
            type: 'album',
            limit: 10
        },
        headers: {
            'Authorization': 'Bearer ' + await getToken()
        },
        success: function (response) {
            console.log(response)
            albumSearches = response.albums.items
            i = 0; //reset position in albumSearches array
            //display the top result
            if (albumSearches[0]) {
                if (getHashParams().guess != query) {
                    var searchUrl = "#guess=" + encodeURIComponent(query)
                    var song = document.getElementById('search_tags2').value
                    if (song != "") {
                        searchUrl += "&song=" + encodeURIComponent(song)
                    }
                    window.location.hash = searchUrl
                }
                displayAlbum(albumSearches[0])
            }
            else {
                removeAlbum()
                document.getElementById("search_error").innerHTML = "<font color='red'>No search results found!</font>"
            }
        }
    });
};

async function searchArtistAlbums() {
    //console.log(albumSearches[i])
    //var artist = albumSearches[i].artists[0].name
    //var artist = document.getElementById("artist").value
    var artist = document.getElementById("artist_select").value
    if (artist != "") {
        document.getElementById('search_tags').value = artist
        searchAlbums(artist)
    }
}

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
    var artistSelectDiv = document.getElementById("artist_select")
    artistSelectDiv.innerHTML = null
    artistSelectDiv.innerHTML = `<option>${album.artists[0].name}</option>`
    for (let j = 1; j < album.artists.length; j++) {
        document.getElementById("artist_text").innerHTML = "Artists:"
        artistDiv.value += ", " + album.artists[j].name
        artistSelectDiv.innerHTML += '<option>' + album.artists[j].name + '</option>'
    }

    //then fetch the tracks
    fetchTracks(album.id)
}

async function fetchTracks(albumId) {
    $.ajax({
            url: 'https://api.spotify.com/v1/albums/' + albumId + '/tracks',
            data: {
                limit: 50
            },
            headers: {
                'Authorization': 'Bearer ' + await getToken()
            },
            success: function (response) {
                //console.log(response)
                //add tracks to dropdown
                var tracksDiv = document.getElementById("tracks")
                tracksDiv.innerHTML = null
                var tracks = response.items
                var song = document.getElementById('search_tags2').value
                for (let j = 0; j < tracks.length; j++) {
                    //console.log(response.items[i].name)
                    //tracks.innerHTML += `<option value=${i}>` + response.items[i].name + '</option>'
                    tracksDiv.innerHTML += `<option value=${tracks[j].external_urls.spotify}>` + tracks[j].name + '</option>'
                }
                console.log(song)
                if (song != "") {
                    document.getElementById("search_error").innerHTML = "<br>"
                    //console.log(tracks)
                    var songSearch = song.toLowerCase()
                    var index = tracks.findIndex(function (track) {
                        return (track.name).toLowerCase() == songSearch
                    })
                    //console.log(index)
                    if (index > -1) {
                        tracksDiv.selectedIndex = index
                    } else {
                        document.getElementById("search_error").innerHTML = `<font color='red'>${song} not found in album!</font>`
                    }
                }
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

async function getToken() {
    var access = getCookie('spotifyAccessToken')
    if (access == undefined || !access) { //if token doesnt exist
        //refresh the token
        access = await refreshToken()
    }
    return access
}

async function refreshToken() {
    //calls the node.js refresh token code that calls spotify's api
    var result = await $.ajax({
        type: 'GET',
        url: '/spotify/refresh_token',
        data: {
            refresh_token: getCookie('spotifyRefreshToken')
        }
    });
    return result.access_token
}
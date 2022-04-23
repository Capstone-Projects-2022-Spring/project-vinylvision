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
/*Store all the divs that won't change*/
var errorDiv
var songDivVal
var previousSearch = [2]
//error handler for the ajax calls
var errorHandler = function (response) {
    console.log(response)
    var errorMessage
    if (response.responseJSON && response.responseJSON.error) { //if spotify has error json
        var error = response.responseJSON.error
        errorMessage = error.status + ': ' + error.message    
    } else { //if no error json from spotify
        errorMessage = response.status
        if (response.responseText != "") errorMessage += ': ' + response.responseText
    }
    errorDiv.textContent = 'Error - ' + errorMessage
}


var albumSearches = null
var trackSearches = []
var i = 0;

//search for an album with the tags from query
async function searchAlbums(query) {
    songDivVal = document.getElementById('search_tags2').value
    if (previousSearch[0] != query) {
        errorDiv = document.getElementById("error_text")
        errorDiv.textContent = "\r\n"
        if (query == "") { //if empty, can require search tags, but dont need to
            if (songDivVal != "") {
                errorDiv.textContent = "Song Search not supported! Please fill in Album Guess."
            } else {
                errorDiv.textContent = "Album Guess required!"
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
                //console.log(response)
                albumSearches = response.albums.items
                i = 0; //reset position in albumSearches array
                previousSearch[0] = query //set previous guesses
                previousSearch[1] = songDivVal
                //display the top result
                if (albumSearches[0]) { //if album searches
                    encodeHash(query, songDivVal)
                    displayAlbum(albumSearches[0])
                    //then fetch the tracks
                    fetchAllTracks(albumSearches)
                }
                else { //no albums found
                    errorDiv.textContent = "No search results found!"
                }
            },
            error: errorHandler
        });
    } else if (previousSearch[1] != songDivVal) {
        previousSearch[1] = songDivVal //set previous guess
        encodeHash(query, songDivVal)
        searchTracks(trackSearches[i], songDivVal)
    }
};

async function encodeHash(album, song) {
    var searchUrl = "#album=" + encodeURIComponent(album)
    if (song != "") {
        searchUrl += "&song=" + encodeURIComponent(song)
    }
    window.location.hash = searchUrl
}

async function searchArtistAlbums() {
    document.getElementById('search_tags2').value = ""
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
        if (albumSearches[i] && trackSearches[i]) { //if theres even enough search results (ive never caught this error)
            displayAlbum(albumSearches[i])
            displayTracks(trackSearches[i])
        } else //if there's not a result, revert the change
            i -= j
    }
}

async function displayAlbum(album) {
    //add image album and alt text
    $("#album_image").attr({
        "src": `${album.images[1].url}`,
        "alt": `${album.name} Album Cover`
    })

    //create album embed
    createEmbed("album", album.id, document.getElementById("spotify-embed-album"))

    //add release date
    document.getElementById("release_date").textContent = album.release_date

    //add album name
    var albumNameDiv = document.getElementById("album_name")
    albumNameDiv.textContent = album.name
    //albumNameDiv.dataset.uri = album.uri //add uri (), this is used for play() (unused)
    albumNameDiv.dataset.url = album.external_urls.spotify //add url, this is opened when using "openTrack"

    //add artist names
    var artistDiv = document.getElementById("artist")
    artistDiv.textContent = album.artists[0].name
    var artistTextDiv = document.getElementById("artist_text")
    artistTextDiv.textContent = "Artist:"
    //for selecting to search the artist
    var artistSelectDiv = document.getElementById("artist_select")
    //artistSelectDiv.innerHTML = `<option>${album.artists[0].name}</option>`
    addDropDownChild(artistSelectDiv, album.artists[0].name, 0)
    for (let j = 1; j < album.artists.length; j++) {
        if(j==1) artistTextDiv.textContent = "Artists:"
        artistDiv.textContent += ", " + album.artists[j].name
        addDropDownChild(artistSelectDiv, album.artists[j].name)
    }
    //remove extraneous nodes
    removeDropDownChildren(artistSelectDiv, album.artists.length, artistSelectDiv.childNodes.length)
}

function addDropDownChild(div, text, pos, value) {
    var child = div.childNodes[pos]
    if (child) { //if it exists already just change the contents
        child.textContent = text
        if (value != null) child.value = value
    } else {
        var opt = document.createElement('option')
        opt.textContent = text
        if (value != null) { //for applying a value with tracks
            opt.value = value
        }
        div.appendChild(opt)
    }
}

//remove dropdown extra dropdown children starting from divlen until truelen is reached
//
function removeDropDownChildren(div, truelen, divlen) {
    for (let j = truelen; j < divlen; j++) {
        div.removeChild(div.lastElementChild)
    }
}

async function fetchTracks(albumId, pos) {
    var result = await $.ajax({
        url: 'https://api.spotify.com/v1/albums/' + albumId + '/tracks',
        data: {
            limit: 50
        },
        headers: {
            'Authorization': 'Bearer ' + await getToken()
        },
        success: function (response) {
            trackSearches[pos] = response.items
            //console.log(trackSearches[pos])
        },
        error: errorHandler
    });
    return result.items
};

async function fetchAllTracks() {
    trackSearches[0] = await fetchTracks(albumSearches[0].id, 0)
    displayTracks(trackSearches[0])
    for (let k = 1; k < albumSearches.length; k++) {
        fetchTracks(albumSearches[k].id, k)
    }
}

async function displayTracks(tracks) {
    var tracksDiv = document.getElementById("tracks")
    //add tracks
    for (let j = 0; j < tracks.length; j++) {
        addDropDownChild(tracksDiv, tracks[j].name, j, tracks[j].id)
    }
    //remove extraneous nodes
    removeDropDownChildren(tracksDiv, tracks.length, tracksDiv.childNodes.length)
    //select the searched track if it finds a match
    searchTracks(tracks, songDivVal)
    
}

async function searchTracks(tracks, song) {
    var tracksDiv = document.getElementById("tracks")
    //search for the song in song guess bar
    if (song != "") {
        errorDiv.textContent = "\r\n"
        //this is just to allow case insensitive searches (search uses this object)
        var index = searchSong(tracks, song)
        if (index > -1) {
            tracksDiv.selectedIndex = index
        } else {
            tracksDiv.selectedIndex = 0
            errorDiv.textContent = `${song} not found in album!`
        }
    }
    createTrackEmbed(tracksDiv.options[tracksDiv.selectedIndex].value)
}

function createTrackEmbed(value) {
    var embedDiv = document.getElementById("spotify-embed-track")
    createEmbed("track", value, embedDiv)
}

/* Create a spotify embed
 * type: "album": creates an embed of the album or "track": creates an embed of the track
 * id: the spotify id of the track or album
 * embedDiv: the div to place the embed in (assuming an iframe there exists)
 */
async function createEmbed(type, id, embedDiv) {
    createBaseEmbed(`https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`, embedDiv)
}

async function createBaseEmbed(src, embedDiv) {
    var frame = embedDiv.firstElementChild
    if (frame) { //if it exists already just change the contents
        var newPlayer = frame.cloneNode(false)
        newPlayer.src = src
        embedDiv.replaceChild(newPlayer, frame)
    } else { //this shouldnt be called but this is just in case the frame doesn't exist already
        var player = document.createElement('iframe')
        player.src = src
        if (type == "album") player.style = "border-radius:12px; width:350px; height:380px"
        else player.style = "border-radius:12px; width:350px; height:80px"
        player.frameBorder = "0"
        player.allowfullscreen = ""
        player.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        embedDiv.appendChild(player)
    }
}

function searchSong(tracks, song) {
    var songSearch = new RegExp(song, 'i')
    var index = tracks.findIndex(function (track) {
        //console.log((track.name).search(song))
        return (track.name).search(songSearch) > -1
    })
    return index
}

function playAlbum() {
    var dataUrl = document.getElementById("album_name").getAttribute("data-url")
    if (dataUrl) {
        window.open(dataUrl, "_blank")
    }
}

function playTrack() {
    var dataUrl = "https://open.spotify.com/track/" + document.getElementById("tracks").value
    if (dataUrl) {
        window.open(dataUrl, "_blank")
    }
}

function removeAlbum() {
    createBaseEmbed("", document.getElementById("spotify-embed-album"))
    createBaseEmbed("", document.getElementById("spotify-embed-track"))

    previousSearch[0] = null
    previousSearch[1] = null

    $("#album_image").attr({
        "src": "",
        "alt": ""
    })

    var albumNameDiv = document.getElementById("album_name")
    albumNameDiv.textContent = ""
    //albumNameDiv.dataset.uri = ""
    albumNameDiv.dataset.url = ""
    document.getElementById("release_date").textContent = ""
    document.getElementById("artist").textContent = ""
    
    var artistSelectDiv = document.getElementById("artist_select")
    while (artistSelectDiv.hasChildNodes()) {
        artistSelectDiv.removeChild(artistSelectDiv.lastElementChild);
    }
    var tracksDiv = document.getElementById("tracks")
    while (tracksDiv.hasChildNodes()) {
        tracksDiv.removeChild(tracksDiv.lastElementChild);
    }
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
        },
        error: errorHandler
    });
    return result.access_token
}
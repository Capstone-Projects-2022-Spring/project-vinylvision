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

/* Encodes the hash and places it in the URL
 * The URL will change to https://vinylvision.web.app#album=abbey%20road&song=Because
 * If no song is present, it will only add the album. If no album is present, it will add it regardless
 * album: String, the guess of the album from the search bar
 * song: String, the guess of the song from the search bar */
async function encodeHash(album, song) {
    var searchUrl = "#album=" + encodeURIComponent(album)
    if (song != "") {
        searchUrl += "&song=" + encodeURIComponent(song)
    }
    window.location.hash = searchUrl
}

/* Store elements retrieved often and by many functions. These are all set in searchAlbums()*/
var errorDiv
var songDivVal
/* An array containing the previous album (0) and song (1) searched */
var previousSearch = [2]
//error handler for the ajax calls, this prints the errors to the errorDiv
var errorHandler = function (response) {
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

/* An array containing the album results of searchAlbum*/
var albumSearches = null
/* An array containing the tracks of every album from albumSearches */
var trackSearches = []
var i = 0; //position in both these arrays (changed by nextSearchResult)

/* Search for an album from Spotify's Web API with a search term
 * query: the term to search for albums on Spotify
 * Only searches if search is different than previous search, and if it isn't empty
 * If album is different, perform the ajax call. Retrieve the album data, display it, and get its tracks
 * Displays if no search results were found
 * If only song is different, call searchTracks() and set previous search
 * Encodes the hash whenever a search is performed to allow the back button to go to a previous search
 */
async function searchAlbums(query) {
    songDivVal = document.getElementById('search_tags2').value //store song guess
    if (previousSearch[0] != query) { //if current search is different than previous one
        errorDiv = document.getElementById("error_text")
        errorDiv.textContent = "\r\n" //set content to be a new line
        if (query == "") { //if empty
            if (songDivVal != "") { //if an attempt to search for only a song
                errorDiv.textContent = "Song Search not supported! Please fill in Album Guess."
            } else { //if both album guess and song search are empty
                errorDiv.textContent = "Album Guess required!"
            }
            return; //stop function
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
                albumSearches = response.albums.items
                i = 0; //reset position in albumSearches array
                previousSearch[0] = query //set previous guesses
                previousSearch[1] = songDivVal
                //display the first result
                if (albumSearches[0]) { //if any results exist
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
    } else if (previousSearch[1] != songDivVal) { //if only song changed
        previousSearch[1] = songDivVal //set previous guess
        encodeHash(query, songDivVal)
        searchTracks(trackSearches[i], songDivVal)
    }
};

/* Search for the artist by getting the artist selected in the dropdown and putting it in Album Guess
 * This will search for albums with the artist's name as a search term
 * If no artist exists, do nothing
 * Resets the song because I assume they just want to search the artist
 */
async function searchArtistAlbums() {
    var artist = document.getElementById("artist_select").value
    if (artist != "") {
        document.getElementById('search_tags2').value = ""
        document.getElementById('search_tags').value = artist
        searchAlbums(artist)
    }
}

/* Show the next search result from albumSearches in player
 * i: the current position in the albumSearches array
 * j: increases or decreases this number
 */
function nextSearchResult(j) {
    //albumSearches exists and bounds of i: 0-9
    //I could have this 10 instead be trackSearches.length but I didn't want any interruptions
    if (albumSearches && (0 <= (i + j) && (i + j) < 10)) {
        i += j
        if (albumSearches[i] && trackSearches[i]) { //if theres even enough search results
            displayAlbum(albumSearches[i])
            displayTracks(trackSearches[i])
        } else //if there's not a result, revert the change
            i -= j
    }
}

/* Retrieve the tracks from an album
 * It only sets returns the result and sets the result so when fetching all tracks,
 * this properly waits before displaying it
 * albumId: id of the album to get the tracks from
 * pos: the position of trackSearches to place the result in
 * return: the result
 */
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
        },
        error: errorHandler
    });
    return result.items
};

/* Retrieve all the tracks from the albums searched
 * Wait for first trackSearches to be set before displaying it, then do rest asyncronously
 */
async function fetchAllTracks() {
    trackSearches[0] = await fetchTracks(albumSearches[0].id, 0)
    displayTracks(trackSearches[0])
    for (let k = 1; k < albumSearches.length; k++) {
        fetchTracks(albumSearches[k].id, k)
    }
}

/* Display the album in the player
 * Displays image, album embed, album name, and release date
 * album: the json object of the album
 */
async function displayAlbum(album) {
    //create album embed
    createEmbed("album", album.id, document.getElementById("spotify-embed-album"))

    //display artists
    displayArtists(album.artists)

    //add image album and alt text
    $("#album_image").attr({
        "src": `${album.images[1].url}`,
        "alt": `${album.name} Album Cover`
    })

    //add release date
    document.getElementById("release_date").textContent = album.release_date

    //add album name
    var albumNameDiv = document.getElementById("album_name")
    albumNameDiv.textContent = album.name
    //albumNameDiv.dataset.uri = album.uri //add uri (), this is used for play() (unused)
    albumNameDiv.dataset.url = album.external_urls.spotify //add url, this is opened when using "openAlbum()"
}

/* Display the artists in the player
 * This will set the artist names and artist dropdown
 * Changes "Artist" to "Artists" if more are present
 * artists: json object of artists from album
 */
async function displayArtists(artists) {
    //set the name and artist text
    var artistTextDiv = document.getElementById("artist_text")
    artistTextDiv.textContent = "Artist:"
    var artistDiv = document.getElementById("artist")
    artistDiv.textContent = artists[0].name

    //add other artists to text and create dropdown
    var artistSelectDiv = document.getElementById("artist_select")
    addDropDownChild(artistSelectDiv, artists[0].name, 0)
    let j = 1
    for (j; j < artists.length; j++) { //if multiple artists
        var name = artists[j].name
        artistDiv.textContent += ", " + name
        addDropDownChild(artistSelectDiv, name)
    }
    //change "Artist" to "Artists" if multiple exist
    if (j > 1) artistTextDiv.textContent = "Artists:"
    //remove extraneous nodes from dropdown
    removeDropDownChildren(artistSelectDiv, artists.length, artistSelectDiv.childNodes.length)
}

/* Display the tracks
 * This will create a dropdown of the tracks and call searchTracks()
 * This will also search for the song in the tracks
 * tracks: a jsonarray of all the tracks within an element trackSearches
 */
async function displayTracks(tracks) {
    var tracksDiv = document.getElementById("tracks")
    //add tracks to dropdown
    for (let j = 0; j < tracks.length; j++) {
        addDropDownChild(tracksDiv, tracks[j].name, j, tracks[j].id)
    }
    //remove extraneous nodes
    removeDropDownChildren(tracksDiv, tracks.length, tracksDiv.childNodes.length)
    //select the searched track if it finds a match
    searchTracks(tracks, songDivVal)
}

/* Search for the song searched within the tracks
 * tracks: a jsonarray of all the tracks within an element trackSearches
 * song: the song within the Song Guess search bar
 */
async function searchTracks(tracks, song) {
    var tracksDiv = document.getElementById("tracks")
    //search for the song in song guess bar
    if (song != "") {
        errorDiv.textContent = "\r\n" //reset errorDiv to new line
        //retrieve the index from searchSong
        var index = searchSong(tracks, song)
        if (index > -1) {
            tracksDiv.selectedIndex = index
        } else { //if not found say it's not found
            tracksDiv.selectedIndex = 0
            errorDiv.textContent = `${song} not found in album!`
        }
    }
    //create track embed of the selected track (default is 0)
    createTrackEmbed(tracksDiv.options[tracksDiv.selectedIndex].value)
}

/* Add an option item to the dropdown list
 * This will only change the text and value if the element exists, but create a new one otherwise
 * div: the element to add the dropdown options to
 * text: the text within the dropdown option
 * pos: the position of the dropdown option in the parent
 * value: the value of the dropdown option (used to retrieve track id)
 */
function addDropDownChild(div, text, pos, value) {
    var child = div.childNodes[pos]
    if (child) { //if it exists already just change the contents
        child.textContent = text
        if (value != null) child.value = value
    } else { //create a new element and add it
        var opt = document.createElement('option')
        opt.textContent = text
        if (value != null) { //for applying a value with tracks
            opt.value = value
        }
        div.appendChild(opt)
    }
}

/* Remove children in div from truelen to divlen
 * Removes from last element for efficiency
 * div: the parent of child nodes
 * trulen: the length of the dropdown
 * divlen: the length of the previous dropdown (or current length)
 */
function removeDropDownChildren(div, truelen, divlen) {
    for (let j = truelen; j < divlen; j++) {
        div.removeChild(div.lastElementChild)
    }
}

/* Remove all children in div
 * div: the parent of child nodes
 */
function removeAllChildren(div) {
    //while (div.hasChildNodes()) div.removeChild(div.lastElementChild);
    removeDropDownChildren(div, 0, div.childNodes.length)
}

/* Create a spotify embed
 * type: "album": creates an embed of the album or "track": creates an embed of the track
 * id: the spotify id of the track or album
 * embedDiv: the div to place the embed in (assuming an iframe there exists)
 */
async function createEmbed(type, id, embedDiv) {
    createBaseEmbed(`https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`, embedDiv)
}

/* Create a spotify track embed
 * id: id of the track
 */
function createTrackEmbed(id) {
    var embedDiv = document.getElementById("spotify-embed-track")
    createEmbed("track", id, embedDiv)
}

/* Creates the basic structure of an embed
 * Copies and replaces the embed with a different src if it exists
 * If that seems inefficient, it was the only way to prevent reloading when changing src
 * Creates a new embed if it doesn't exist (this should never happen)
 * src: the link for spotify's embed to display
 * embedDev: the div to insert the embed into
 */
async function createBaseEmbed(src, embedDiv) {
    var frame = embedDiv.firstElementChild
    if (frame) { //if it exists already just replace and change the contents
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

/* Searches for the String song within every track
 * This will see if the string is contained within a track name. It's not case sensitive
 * tracks: a jsonarray containing all the tracks of a song
 * song: a String to search each track for
 * return: the index of the guessed song within tracks. returns -1 if not found
 */
function searchSong(tracks, song) {
    var songSearch = new RegExp(song, 'i') //i: not case sensitive
    var index = tracks.findIndex(function (track) { //find index where search() returns valid index
        return (track.name).search(songSearch) > -1
    })
    return index
}

/* Remove the album from the player
 * This will remove all visual indications of the player. This is rarely called
 * Resets the embed links, previous searches, album image, album name, release date,
 * artists, artist dropdown and track dropdown
 */
function removeAlbum() {
    //remove embed links
    createBaseEmbed("", document.getElementById("spotify-embed-album"))
    createBaseEmbed("", document.getElementById("spotify-embed-track"))

    //reset previous searches
    previousSearch[0] = null
    previousSearch[1] = null

    $("#album_image").attr({ //reset album image
        "src": "",
        "alt": ""
    })

    //reset release date
    document.getElementById("release_date").textContent = ""

    //reset album name & url stored inside
    var albumNameDiv = document.getElementById("album_name")
    albumNameDiv.textContent = ""
    //albumNameDiv.dataset.uri = ""
    albumNameDiv.dataset.url = ""

    //reset artist name
    document.getElementById("artist").textContent = ""

    //remove children from artist dropdown
    removeAllChildren(document.getElementById("artist_select"))
    //remove children from track dropdown
    removeAllChildren(document.getElementById("tracks"))
    
}

/* Open the album in Spotify's web player website
 * Gets the url stored as an attribute in the album name and opens it
 */
function openAlbum() {
    var dataUrl = document.getElementById("album_name").getAttribute("data-url")
    openTab(dataUrl)
}

/* Open the track in Spotify's web player website
 * Gets the id stored as a value and opens it
 */
function openTrack() {
    var dataUrl = "https://open.spotify.com/track/" + document.getElementById("tracks").value
    openTab(dataUrl)
}

/* Opens a URL in a new tab
 * dataUrl: the url to open
 */
function openTab(dataUrl) {
    if (dataUrl) {
        window.open(dataUrl, "_blank")
    }
}

/* Retrieves the access token from the cookie
 * If token doesn't access, request for a new one with refreshToken()
 * return: the access token
 */
async function getToken() {
    var access = getCookie('spotifyAccessToken')
    if (access == undefined || !access) { //if token doesnt exist
        //refresh the token
        access = await refreshToken()
    }
    return access
}

/* Refreshes the access token using the refresh token stored as a cookie
 * Calls the index.js server with an ajax call to retrieve the token for security purposes and speed
 * return: the new access token
 */
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
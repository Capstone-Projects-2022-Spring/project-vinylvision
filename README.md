# VinylVision

VinylVision is a web application that enables users to discover unknown music in multiple ways. Namely, a user can find music they do not recognize by supplying an image of an album’s artwork or a brief audio recording of a song. With the help of novel image and audio recognition technologies, the service will obtain information about the song or album the user is looking for, such as song title, album title, artist name, etc. Using these recovered details, VinylVision will search for the song or album in either Spotify or Apple Music, depending on the preference of the user. If the search is successful, the application will provide the user with a mini player allowing them to listen to snippets of songs from the album they were looking for. To listen to the songs in full, the user can choose to be redirected to their preferred music player application. Additionally, the service will recommend albums similar to the one the user was searching for, offering another opportunity for users to come across new music.

Users will be able to input an image or audio recording in two ways. Moreover, if a user allows VinylVision to access their device’s camera and microphone, the user could capture an image or record audio to submit to the service. A user could also upload an image or audio file already stored on their device.

If a user inputs an image containing album artwork, VinylVision will send it to Google’s Cloud Vision API. This image recognition API will respond to VinylVision with details of the album, e.g., album title, artist name. Then, VinylVision will send these details to either Spotify’s or Apple Music’s API. These APIs allow VinylVision to search Spotify or Apple Music for the user’s desired album using the details recovered from the Cloud Vision API. They will then respond to VinylVision with the mini player and album recommendations.

The data flow is similar if a user inputs audio. VinylVision will send the audio data to the AudD Music Recognition API. This API will analyze the song in the audio provided by the user, and respond to VinylVision details such as song title, artist name, album name, etc. At this point, the flow of data is the same as when an image is used as input. VinylVision sends the newly obtained details to the Spotify or Apple Music API, which will respond with the mini player and album recommendations. 


[VinylVision Software Testing.xlsx](https://github.com/Capstone-Projects-2022-Spring/project-vinylvision/files/8468370/VinylVision.Software.Testing.xlsx)



### Team Members
Anthony Guerrelli, John Crane, Robert Morsa, Mikhail Sajed, Andrew Pari

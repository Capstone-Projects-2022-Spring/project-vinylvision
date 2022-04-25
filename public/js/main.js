// Copyright 2015, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License")
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const compressImage = (imageFile, quality) => {
    return new Promise((resolve, reject) => {
        const $canvas = document.createElement("canvas");
        const image = new Image();
        image.onload = () => {
            $canvas.width = image.width;
            $canvas.height = image.height;
            $canvas.getContext("2d").drawImage(image, 0, 0);
            $canvas.toBlob(
                (blob) => {
                    if (blob === null) {
                        return reject(blob);
                    } else {
                        resolve(blob);
                    }
                },
                "image/jpeg",
                quality / 100
            );
        };
        image.src = URL.createObjectURL(imageFile);
    });
};

'use strict';

var CV_URL = 'https://vision.googleapis.com/v1/images:annotate?key=' + window.apiKey;

const censor = [
  'album',
  'artwork',
  'cover',
  'vinyl',
  '[vinyl]',
  'usa',
  'import',
  'lp',
  '[lp]',
  'cd',
  '[cd]',
  '(album)',
  'poster',
  't shirt',
  't-shirt',
  'soundtrack',
  'mfsl',
  'review',
  '2015',
  '2016',
  '2017',
  '2018',
  '2019',
  '2020',
  '2021',
  '2022'
]

$(function () {
  $('#fileform').on('submit', uploadFiles);
});

/**
 * 'submit' event handler - reads the image bytes and sends it to the Cloud
 * Vision API.
 */
async function uploadFiles(event) {
  event.preventDefault(); // Prevent the default form post

  // Grab the file and asynchronously convert to base64.
    var file = $('#fileform [name=fileField]')[0].files[0];
    //console.log(file)
    const blob = await compressImage(file, 10); //compress image by 90%
    //console.log(blob)
  var reader = new FileReader();
  reader.onloadend = processFile;
  reader.readAsDataURL(blob);
}

/**
 * Event handler for a file's data url - extract the image data and pass it off.
 */
async function processFile(event) {
    //console.log(event)
    var content = event.target.result;
    var image = content.replace('data:image/jpeg;base64,', '')
    fetch('/machinelearning', {
        method: 'POST',
        body: JSON.stringify({
            file: image
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json()).then(data => {
        if (data.failure == "true"){
            document.getElementById('login').textContent = "Your submission could not be recognized with very high confidence. Try submitting again, or use web detection for a wider range of results."
        } else {
            document.getElementById('login').textContent = "Your predicted album cover is: " + data.label + " with a confidence of " + data.confidence + "."
        }
     });
    
  //sendFileToCloudVision(image);
}

/**
 * Sends the given file contents to the Cloud Vision API and outputs the
 * results.
 */
function sendFileToCloudVision(content) {
  var type = $('#fileform [name=type]').val();

  // Strip out the file prefix when you convert to json.
  var request = {
    requests: [{
      image: {
        content: content
      },
      features: [{
        type: type,
        maxResults: 1
      }]
    }]
  };

    //hide login
    $("#login").hide()
  $('#results').text('Loading...');
  $.post({
    url: CV_URL,
    data: JSON.stringify(request),
    contentType: 'application/json'
  }).fail(function (jqXHR, textStatus, errorThrown) {
    $('#results').text('ERRORS: ' + textStatus + ' ' + errorThrown);
  }).done(displayJSON);
}

/**
 * Displays the results.
 */
function displayJSON(data) {
  var data2;
  var contents;
  var label;

  if (!data) { //if no response print error message to the screen
    data2 = "Sorry! No guess from Google Vision - Please try again!"
    contents = JSON.stringify(data2, null, 5);
  }

  else{ 
    var visionGuessString = data.responses[0].webDetection.bestGuessLabels[0].label; //
    var visionGuessArray = visionGuessString.split(" ");
    console.log(visionGuessArray)
    label = visionGuessArray.filter(x => !censor.includes(x)) //remove words in censor array from visionGuessArray
    console.log(label); 
    label = label.join(' '); //store cleaned vision guess array as a string with words separated by space - guess can now be searched with Spotify
    data2 = ('Your album cover is: ' + label);
    console.log(data2);
    contents = JSON.stringify(data, null, 5); //do we need this
  }

  $('#results').text(data2);
  var evt = new Event('results-displayed'); //do we need this stuff either
  evt.results = contents;
  document.dispatchEvent(evt);
  //add spotify login div with the label from google vision as a parameter in url
    $("#login").attr(
        "href", `spotify/login/:search?album=${encodeURIComponent(label)}`
    ).show()
}

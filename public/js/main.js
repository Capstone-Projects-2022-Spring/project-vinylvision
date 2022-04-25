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
    var type = $('#fileform [name=type]').val();
    console.log(type);
    var content = event.target.result;
    var image = content.replace('data:image/jpeg;base64,', '')
    if (type == "MACHINE_DETECTION") {
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
              var jawn = data.label
              jawn = jawn.replaceAll('_',' ');
              console.log(jawn)
              document.getElementById('login').innerHTML = `<a href='spotify/login/:search?guess=${jawn}' type='button'>Search with Spotify</a>`
          }
      });
    }
    else if (type == "WEB_DETECTION") {
      sendFileToCloudVision(type, image);
      displayJSON()
    }
}

/**
 * Sends the given file contents to the Cloud Vision API and outputs the
 * results.
 */
function sendFileToCloudVision(type, content) {
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

    //set spotify login div to null (to remove previous one)
    document.getElementById('login').innerHTML = null
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
  if (!data) {
    
  }
    var label = data.responses[0].webDetection.bestGuessLabels[0].label
    var data2 = ('Your album cover is: \t' + label);
  //console.log(data2);
  var contents = JSON.stringify(data, null, 5);
  $('#results').text(data2);
  var evt = new Event('results-displayed');
  evt.results = contents;
  document.dispatchEvent(evt);
    //add spotify login div with the label from google vision as a parameter in url
    document.getElementById('login').innerHTML = `<a href='spotify/login/:search?guess=${label}' type='button'>Search with Spotify</a>`
}

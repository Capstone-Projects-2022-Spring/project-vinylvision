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

("use strict");

var CV_URL =
  "https://vision.googleapis.com/v1/images:annotate?key=" + window.apiKey;

const censor = [
  "album",
  "artwork",
  "cover",
  "vinyl",
  "[vinyl]",
  "usa",
  "import",
  "lp",
  "[lp]",
  "cd",
  "[cd]",
  "(album)",
  "poster",
  "t shirt",
  "t-shirt",
  "soundtrack",
  "mfsl",
  "review",
  "2015",
  "2016",
  "2017",
  "2018",
  "2019",
  "2020",
  "2021",
  "2022",
  "itunes",
  "spotify",
  "last fm",
  "amazon",
  "original",
];

$(function () {
  $("#fileform").on("submit", uploadFiles);
});

/**
 * 'submit' event handler - reads the image bytes and sends it to the Cloud
 * Vision API.
 */
async function uploadFiles(event) {
  event.preventDefault(); // Prevent the default form post

  // Grab the file and asynchronously convert to base64.
  var file = $("#fileform [name=fileField]")[0].files[0];
  //this line converts the extension of files to .jpg since the Vision API only accepts jpg files
  file.name = file.name.substr(0, file.name.lastIndexOf(".")) + ".jpg";
  const blob = await compressImage(file, 10); //compress image by 90%
  var reader = new FileReader();
  reader.onloadend = processFile;
  reader.readAsDataURL(blob);
}

/**
 * Event handler for a file's data url - extract the image data and pass it off.
 */
async function processFile(event) {
  var type = $("#fileform [name=type]").val();
  console.log(type);
  var content = event.target.result;
  var image = content.replace("data:image/jpeg;base64,", "");
  if (type == "MACHINE_DETECTION") {
    fetch("/machinelearning", {
      method: "POST",
      body: JSON.stringify({
        file: image,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.failure == "true") {
          document.getElementById("album-details").textContent =
            "Your submission could not be recognized with very high confidence. Try submitting again, or use web detection for a wider range of results.";
        } else {
          var album_title = data.label;
          album_title = album_title.replaceAll("_", " ");
          document.getElementById("album-details").textContent =
            "Your predicted album cover is: " +
            album_title +
            " with a confidence of " +
            data.confidence +
            ".";

          //add spotify login div with the label from google vision as a parameter in url
          $("#login")
            .attr(
              "href",
              `spotify/login/:search?album=${encodeURIComponent(album_title)}`
            )
            .show();
        }
      });
  } else if (type == "WEB_DETECTION") {
    sendFileToCloudVision(type, image);
    displayJSON();
  }
}

/**
 * Sends the given file contents to the Cloud Vision API and outputs the
 * results.
 */
function sendFileToCloudVision(type, content) {
  // Strip out the file prefix when you convert to json.
  var request = {
    requests: [
      {
        image: {
          content: content,
        },
        features: [
          {
            type: type,
            maxResults: 1,
          },
        ],
      },
    ],
  };

  //hide login
  $("#login").hide();
  $("#results").text("Loading...");
  $.post({
    url: CV_URL,
    data: JSON.stringify(request),
    contentType: "application/json",
  })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $("#results").text("ERRORS: " + textStatus + " " + errorThrown);
    })
    .done(displayJSON);
}

/**
 * Displays the results.
 */
function displayJSON(data) {
  var data2;
  var contents;
  var label;

  var visionGuessString =
    data.responses[0].webDetection.bestGuessLabels[0].label; //
  var visionGuessArray = visionGuessString.split(" ");
  label = visionGuessArray.filter((x) => !censor.includes(x)); //remove words in censor array from visionGuessArray
  label = label.join(" "); //store cleaned vision guess array as a string with words separated by space - guess can now be searched with Spotify
  data2 = "Your album cover is: " + label;
  contents = JSON.stringify(data, null, 5); //do we need this

  $("#results").text(data2);
  var evt = new Event("results-displayed"); //do we need this stuff either
  evt.results = contents;
  document.dispatchEvent(evt);
  //add spotify login div with the label from google vision as a parameter in url
  $("#login")
    .attr("href", `spotify/login/:search?album=${encodeURIComponent(label)}`)
    .show();
}

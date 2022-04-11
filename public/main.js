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

'use strict';
require('dotenv').config();

//const filename = "/Users/john/Downloads/ram.jpeg";
const endpointId = "6781198381889880064";
const project = 'tu-vinylvision';
const location = 'us-central1';
const aiplatform = require('@google-cloud/aiplatform');
const {instance, params, prediction} = aiplatform.protos.google.cloud.aiplatform.v1.schema.predict;

var CV_URL = 'https://vision.googleapis.com/v1/images:annotate?key=' + window.apiKey;

// Imports the Google Cloud Prediction Service Client library
const {PredictionServiceClient} = aiplatform.v1;

// Specifies the location of the api endpoint
const clientOptions = {
  apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};

// Instantiates a client
const predictionServiceClient = new PredictionServiceClient(clientOptions);

async function predictImageClassification(image) {
  // Configure the endpoint resource
  const endpoint = `projects/${project}/locations/${location}/endpoints/${endpointId}`;

  const parametersObj = new params.ImageClassificationPredictionParams({
    confidenceThreshold: 0.0001,
    maxPredictions: 5,
  });
  const parameters = parametersObj.toValue();

  //const fs = require('fs');
  //const image = fs.readFileSync(filename, 'base64');
  const instanceObj = new instance.ImageClassificationPredictionInstance({
    content: image,
  });
  const instanceValue = instanceObj.toValue();

  const instances = [instanceValue];
  const request = {
    endpoint,
    instances,
    parameters,
  };

  // Predict request
  const [response] = await predictionServiceClient.predict(request);

  console.log('Predict image classification response');
  console.log(`\tDeployed model id : ${response.deployedModelId}`);
  const predictions = response.predictions;
  console.log('\tPredictions :');
  for (const predictionValue of predictions) {
    const predictionResultObj =
      prediction.ClassificationPredictionResult.fromValue(predictionValue);
    for (const [i, label] of predictionResultObj.displayNames.entries()) {
      console.log(`\tDisplay name: ${label}`);
      console.log(`\tConfidences: ${predictionResultObj.confidences[i]}`);
      console.log(`\tIDs: ${predictionResultObj.ids[i]}\n\n`);
    }
  }
}

$(function () {
  $('#fileform').on('submit', uploadFiles);
});

/**
 * 'submit' event handler - reads the image bytes and sends it to the Cloud
 * Vision API.
 */
function uploadFiles (event) {
  event.preventDefault(); // Prevent the default form post

  // Grab the file and asynchronously convert to base64.
  var file = $('#fileform [name=fileField]')[0].files[0];
  var reader = new FileReader();
  reader.onloadend = processFile;
  reader.readAsDataURL(file);
}

/**
 * Event handler for a file's data url - extract the image data and pass it off.
 */
function processFile (event) {
  var content = event.target.result;
  console.log(content)
  sendFileToCloudVision(content.replace('data:image/jpeg;base64,', ''));
}

/**
 * Sends the given file contents to the Cloud Vision API and outputs the
 * results.
 */
function sendFileToCloudVision (content) {
  var type = $('#fileform [name=type]').val();
  if (type == "WEB_DETECTION") {

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

    $('#results').text('Loading...');
    $.post({
      url: CV_URL,
      data: JSON.stringify(request),
      contentType: 'application/json'
    }).fail(function (jqXHR, textStatus, errorThrown) {
      $('#results').text('ERRORS: ' + textStatus + ' ' + errorThrown);
    }).done(displayJSON);

    /**
     * Displays the results.
     */
    function displayJSON (data) {
      var contents = JSON.stringify(data, null, 4);
      $('#results').text(contents);
      var evt = new Event('results-displayed');
      evt.results = contents;
      document.dispatchEvent(evt);
    }
  }
  else {
    predictImageClassification(content);
  }
}

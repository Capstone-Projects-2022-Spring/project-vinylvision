//<script type="text/javascript" src="https://code.jquery.com/jquery-1.7.1.min.js"></script>
//require("https://code.jquery.com/jquery-1.7.1.min.js")
/*var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);*/
const fs = require('fs');
const endpointId = "6781198381889880064";
const project = 'tu-vinylvision';
const location = 'us-central1';
const aiplatform = require('@google-cloud/aiplatform');
const { instance, params, prediction } =
    aiplatform.protos.google.cloud.aiplatform.v1.schema.predict;

// Imports the Google Cloud Prediction Service Client library
const { PredictionServiceClient } = aiplatform.v1;

// Specifies the location of the api endpoint
const clientOptions = {
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
};

// Instantiates a client
const predictionServiceClient = new PredictionServiceClient(clientOptions);

require('dotenv').config();

async function main(file, callback) {
  // [START aiplatform_predict_image_classification_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.\
   * (Not necessary if passing values as arguments)
   */
    //console.log(file)
  
    //event.preventDefault(); // Prevent the default form post
  
    // Grab the file and asynchronously convert to base64.
    /*var filename = ''
    $(function () {
      filename = $('#fileform').on('submit', uploadFiles)
    })
    var reader = new FileReader()
    reader.onloadend = processFile
    reader.readAsDataURL(file)*/
  
  
  
  //const filename = "/Users/aguerrelli/Desktop/BeatlesAbbey_Road.jpg";
  //const filename = "/Users/aguerrelli/Desktop/StoneyCover.jpeg";
    predictImageClassification(file, callback)

  return ;
  // [END aiplatform_predict_image_classification_sample]
}

async function predictImageClassification(file, callback) {
    //console.log("return")
    //callback("the label")
    //return
    // Configure the endpoint resource
    const endpoint = `projects/${project}/locations/${location}/endpoints/${endpointId}`;

    const parametersObj = new params.ImageClassificationPredictionParams({
        confidenceThreshold: 0.5,
        maxPredictions: 5,
    });
    const parameters = parametersObj.toValue();

    //const image = fs.readFileSync(filename, 'base64');
    const image = file
    //console.log("image: " + image)
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
    //console.log(`\tDeployed model id : ${response.deployedModelId}`);
    const predictions = response.predictions;
    //console.log('\tPredictions :');
    var slabel = ""
    var failure = "true"
    for (const predictionValue of predictions) {
        const predictionResultObj =
            prediction.ClassificationPredictionResult.fromValue(predictionValue);
        for (const [i, label] of predictionResultObj.displayNames.entries()) {
            slabel = label
            failure = "false"
            if (predictionResultObj.confidences[i] > parametersObj.confidenceThreshold) {
                console.log(`\tYour album cover is:\t ${label}`);
                console.log(`\tConfidence:\t ${predictionResultObj.confidences[i]}\n`);
            } else {
                console.log("Your submission could not be recognized with very high confidence. Try submitting again, or use web detection for a wider range of results.");
            }
            //console.log(`\tIDs: ${predictionResultObj.ids[i]}\n\n`);
            callback(slabel, parametersObj.confidenceThreshold, predictionResultObj.confidences[i], "false")
        }
        if (failure == "true") {
            callback("", "", "", failure)
        }
    }
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

//main();

module.exports = { //for external use of functions
  main: main
}
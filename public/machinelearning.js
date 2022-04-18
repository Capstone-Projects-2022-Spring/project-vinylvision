'use strict';
require('dotenv').config();

function main() {
  // [START aiplatform_predict_image_classification_sample]
  /**
   * TODO(developer): Uncomment these variables before running the sample.\
   * (Not necessary if passing values as arguments)
   */

  //const filename = "/Users/aguerrelli/Desktop/BeatlesAbbey_Road.jpg";
  const filename = "/Users/aguerrelli/Desktop/StoneyCover.jpeg";
  const endpointId = "6781198381889880064";
  const project = 'tu-vinylvision';
  const location = 'us-central1';
  const aiplatform = require('@google-cloud/aiplatform');
  const {instance, params, prediction} =
    aiplatform.protos.google.cloud.aiplatform.v1.schema.predict;

  // Imports the Google Cloud Prediction Service Client library
  const {PredictionServiceClient} = aiplatform.v1;

  // Specifies the location of the api endpoint
  const clientOptions = {
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
  };

  // Instantiates a client
  const predictionServiceClient = new PredictionServiceClient(clientOptions);

  async function predictImageClassification() {
    // Configure the endpoint resource
    const endpoint = `projects/${project}/locations/${location}/endpoints/${endpointId}`;

    const parametersObj = new params.ImageClassificationPredictionParams({
      confidenceThreshold: 0.5,
      maxPredictions: 5,
    });
    const parameters = parametersObj.toValue();

    const fs = require('fs');
    const image = fs.readFileSync(filename, 'base64');
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
    for (const predictionValue of predictions) {
      const predictionResultObj =
        prediction.ClassificationPredictionResult.fromValue(predictionValue);
      for (const [i, label] of predictionResultObj.displayNames.entries()) {
        if(predictionResultObj.confidences[i] > parametersObj.confidenceThreshold) {
          console.log(`\tYour album cover is:\t ${label}`);
          console.log(`\tConfidence:\t ${predictionResultObj.confidences[i]}\n`);
        } else {
          console.log("Your submission could not be recognized with very high confidence. Try submitting again, or use web detection for a wider range of results.");
        }
        //console.log(`\tIDs: ${predictionResultObj.ids[i]}\n\n`);
      }
    }
  }
  predictImageClassification();
  // [END aiplatform_predict_image_classification_sample]
}

process.on('unhandledRejection', err => {
  console.error(err.message);
  process.exitCode = 1;
});

main();
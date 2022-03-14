// Copyright 2016, Google, Inc.
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

// Replace with the key you created at https://cloud.google.com/console
const GCP_API_KEY = "AIzaSyDN2XoldRX6dmfPa_otQImR74m7u2XGmXQ"
const GCP_API_KEY_2 = "AIzaSyC_molS5gfyj9ZiBwebAivDzTNYeK0L5V0"

function randomizeKey() {
  if (GCP_API_KEY_2 && (Math.random() > 0.5)) {
    console.log("API KEY 2 at " + new Date())
    return GCP_API_KEY_2;
  }
  console.log("API KEY 1 at " + new Date())
  return  GCP_API_KEY;
}
window.apiKey = randomizeKey();

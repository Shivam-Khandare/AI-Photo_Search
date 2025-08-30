import { GoogleAuth } from 'google-auth-library';
import fetch from 'node-fetch'; // Run `npm install node-fetch` if you are not using Node.js v18+

// --- CONFIGURATION ---
// You should move these to your .env file for better security
const GCLOUD_PROJECT_ID = process.env.GCLOUD_PROJECT_ID;
const GCLOUD_LOCATION = process.env.GCLOUD_LOCATION || 'us-central1';
// --- END CONFIGURATION ---

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

const model = 'multimodalembedding@001';

async function getEmbedding(instance) {
  const client = await auth.getClient();
  const accessToken = (await client.getAccessToken()).token;

  const apiUrl = `https://${GCLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCLOUD_PROJECT_ID}/locations/${GCLOUD_LOCATION}/publishers/google/models/${model}:predict`;

  const requestBody = {
    instances: [instance],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Google AI API Error Response:', result);
      throw new Error('The Google AI API request failed.');
    }
    
    if (result.error) {
        console.error('Google AI API returned an error:', result.error);
        throw new Error(result.error.message);
    }

    return result.predictions[0].textEmbedding || result.predictions[0].imageEmbedding;

  } catch (error) {
    console.error('🔴 getEmbedding function failed:', error);
    throw error;
  }
}

/**
 * Gets the vector embedding for a given text.
 * @param {string} text The text to embed.
 * @returns {Promise<number[]>} The vector embedding.
 */
export async function getTextEmbedding(text) {
    return getEmbedding({ text: text });
}

/**
 * Gets the vector embedding for a given image buffer.
 * @param {Buffer} imageBuffer The image file buffer.
 * @returns {Promise<number[]>} The vector embedding.
 */
export async function getImageEmbedding(imageBuffer) {
    const imageBase64 = imageBuffer.toString('base64');
    return getEmbedding({ image: { bytesBase64Encoded: imageBase64 } });
}
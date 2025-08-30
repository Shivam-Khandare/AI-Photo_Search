// src/controllers/imageController.js

import Image from '../models/Image.js';
import { getTextEmbedding, getImageEmbedding } from '../utils/googleAI.js';

const indexImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }
    const { userId, deviceImagePath } = req.body;
    if (!userId || !deviceImagePath) {
      return res.status(400).json({ message: 'User ID and device image path are required.' });
    }
    const existingImage = await Image.findOne({ deviceImagePath, userId });
    if (existingImage) {
      // Let's add a log here too, so we know when an image is skipped.
      console.log(`[INFO] Image already indexed, skipping: ${deviceImagePath}`);
      return res.status(200).json({ message: 'Image already indexed.' });
    }

    const imageBuffer = req.file.buffer;
    const embedding = await getImageEmbedding(imageBuffer);
    
    if (!embedding) {
        return res.status(500).json({ message: 'Failed to generate image embedding.' });
    }

    const newImage = new Image({ userId, deviceImagePath, embedding });
    await newImage.save();

    // ADD THIS LOG FOR SUCCESSFUL INDEXING
    console.log(`[SUCCESS] Indexed image: ${deviceImagePath}`);

    res.status(201).json({ message: 'Image indexed successfully.' });

  } catch (error) {
    console.error('--- INDEXING ERROR ---', error.message);
    res.status(500).json({ message: 'Server error during image indexing.' });
  }
};

const searchImages = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Search prompt is required.' });
    }

    const queryEmbedding = await getTextEmbedding(prompt);

    // console.log("--- COPY THE VECTOR BELOW FOR ATLAS DEBUGGING ---");
    // console.log(JSON.stringify(queryEmbedding));

    if (!queryEmbedding) {
        return res.status(500).json({ message: 'Failed to get embedding for prompt.' });
    }

    const results = await Image.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 10,
        },
      },
      {
        $project: {
          _id: 0,
          deviceImagePath: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
      {
        $match: {
          score: { $gte: 0.52 } // Only return results with a score of 75% or higher
        }
      }
    ]);

    // ADD THIS LOG FOR SUCCESSFUL SEARCHES
    console.log(`[SUCCESS] Searched for prompt: "${prompt}"`);
    console.log('[RESULTS WITH SCORES]:', results);

    res.status(200).json(results);
  } catch (error) {
    console.error('--- SEARCH ERROR ---', error.message);
    res.status(500).json({ message: 'Server error during search.' });
  }
};

export { indexImage, searchImages };
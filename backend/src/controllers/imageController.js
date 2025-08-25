import axios from 'axios';
import Image from '../models/Image.js';

// The final, reliable Hugging Face CLIP model
const MODEL_URL = 'https://api-inference.huggingface.co/models/sentence-transformers/clip-ViT-B-32';

const indexImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded.' });
    }
    const { userId, deviceImagePath } = req.body;
    if (!userId || !deviceImagePath) {
      return res.status(400).json({ message: 'User ID and device image path are required.' });
    }
    const existingImage = await Image.findOne({ deviceImagePath });
    if (existingImage) {
      return res.status(200).json({ message: 'Image already indexed.' });
    }

    const imageBuffer = req.file.buffer;
    // This tells the API to wait for the model to load if it's "asleep"
    const response = await axios.post(MODEL_URL, imageBuffer, {
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': req.file.mimetype,
      },
      // This is the crucial new option
      params: {
        wait_for_model: true
      }
    });

    const embedding = response.data;
    const newImage = new Image({ userId, deviceImagePath, embedding });
    await newImage.save();
    res.status(201).json({ message: 'Image indexed successfully.' });
  } catch (error) {
    console.error('--- INDEXING ERROR ---', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Server error during image indexing.' });
  }
};

const searchImages = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ message: 'Search prompt is required.' });
    }

    const response = await axios.post(
      MODEL_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
        },
        // This is the crucial new option
        params: {
          wait_for_model: true
        }
      }
    );
    
    const queryEmbedding = response.data;
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
    ]);

    res.status(200).json(results);
  } catch (error) {
    console.error('--- SEARCH ERROR ---', error.response ? error.response.data : error.message);
    res.status(500).json({ message: 'Server error during search.' });
  }
};

export { indexImage, searchImages };
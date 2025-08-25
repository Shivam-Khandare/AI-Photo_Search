import express from 'express';
import multer from 'multer';
import {indexImage, searchImages} from '../controllers/imageController.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage});

const router = express.Router();

router.post('/index', upload.single('image'), indexImage);

router.post('/search', searchImages);

export default router;
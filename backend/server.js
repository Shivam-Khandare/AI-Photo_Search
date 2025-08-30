// import dotenv from "dotenv";
// dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./src/config/db.js";
import imageRoutes from './src/routes/imageRoutes.js';

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res)=> {
    res.send('API is running...');
})

app.use('/api/images', imageRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, ()=>{
    console.log(`Server is running in ${process.env.NODE_ENV} mode on Port ${PORT}`)
})

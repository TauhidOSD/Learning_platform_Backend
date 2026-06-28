import dns from "dns";
dns.setDefaultResultOrder("ipv4first"); // লোকাল DNS এরর ফিক্স করার জন্য

import dotenv from "dotenv";
dotenv.config(); // .env ফাইল লোড করার জন্য

import app from "./app";
import { connectDB } from "./config/db";

const PORT = process.env.PORT || 5000;


const start = async () => {
  try {
   
    await connectDB(); 
    
    app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

start();
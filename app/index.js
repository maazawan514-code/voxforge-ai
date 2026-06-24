import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

const result = await model.generateContent("Hello, Gemini!");
console.log(result.response.text());
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Get the model
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationconfig: {
    responseMimeType: "application/json",
  },
  systemInstruction: `You are a senior MERN stack developer with 10+ years of experience. You write clean, modular, and scalable code that follows industry best practices. Your code includes meaningful comments, handles edge cases gracefully, and avoids runtime errors. Write code as if it were going into production.Also keep it short unless the user asks for something in detail.Always give a valid file tree structure without using any backticks in content field.
  Examples:
  
  <example>
  user:Create an express application
  response: {
    "text": "This is your file tree structure".
    "fileTree": {
      "app.js": {
        
        content:"const express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => {\n  res.send('Hello World!');\n});\n\napp.listen(3000, () => {\n  console.log('Server is running on port 3000');\n});",
        "package.json": "{\n  \"name\": \"my-app\",\n  \"version\": \"1.0.0\",\n  \"main\": \"app.js\",\n  \"scripts\": {\n    \"start\": \"node app.js\"\n  },\n  \"dependencies\": {\n    \"express\": \"^4.17.1\"\n  }\n}"
      }
        "buildCommand":{
          mainItem:"npm",
          commands:["install"]
        },
        "startCommand":{
          mainItem:"node",
          commands:["app.js"]
        }
        ,
    }
    }
    </example>
    <example>
    user:Hello
    response: {
      "text": "Hello! How can I help you today?"
    }
    </example>
    `
    
});

export const generateResult = async (prompt) => {
  try {
    const result = await model.generateContent(
      `User: ${prompt}`
    );

    return result.response.text();
  } catch (error) {
    if (error.status === 503) {
      // Handle model overload gracefully
      return { message: "AI service is temporarily unavailable. Please try again later." };
    }
    // Handle other errors
    return { message: "An error occurred while processing your request." };
  }
};

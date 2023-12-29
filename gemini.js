const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3333;

// Access your API key as an environment variable
const apiKey = "AIzaSyBXKKqql55PMGHSwWDiuoSmVNpAYiQ4W3c"; 
const genAI = new GoogleGenerativeAI(apiKey);

app.use(express.json()); // Parse JSON request bodies


app.post("/generateContent", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = req.body.prompt;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ result: text });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

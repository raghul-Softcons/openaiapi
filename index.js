const express = require("express");
const OpenAI = require("openai");
const app = express();
app.use(express.json());

const key = "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";

const openai = new OpenAI({
  apiKey: key,
});

// Initialize conversation history
let conversationHistory = [
  {
    role: "system",
    content: "You are a helpful assistant.",
  },
];

app.post("/get-value", async (req, res) => {
  try {
    // Assuming the user sends a JSON object with a "sentence" property
    const userSentence = req.body.sentence;

    if (!userSentence) {
      return res.status(400).json({
        success: false,
        error: "Please provide a 'sentence' in the request body.",
      });
    }

    // Add user's message to conversation history
    conversationHistory.push({
      role: "user",
      content: userSentence,
    });

    // Get OpenAI response based on the entire conversation
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: conversationHistory,
    });

    // Log the assistant's response
    console.log(response.choices[0]);

    // Add the assistant's response to conversation history
    conversationHistory.push({
      role: "assistant",
      content: response.choices[0].message.content,
    });

    // Return the assistant's response to the client
    res.status(200).json({
      success: true,
      message: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error from OpenAI API:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while processing your request.",
    });
  }
});

const port = 9872;
app.listen(port, () => console.log("Server is running on port", port));

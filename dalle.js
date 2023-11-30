const express = require("express");
const OpenAI = require("openai");
const app = express();
app.use(express.json());

const key = "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";
const openai = new OpenAI({ apiKey: key });

app.post("/generate-image", async (req, res) => {
  try {
    const userPrompt = req.body.prompt;

    if (!userPrompt) {
      return res.status(400).json({
        success: false,
        error: "Please provide a 'prompt' in the request body.",
      });
    }

    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt: userPrompt,
    });

    console.log(image.data);

    res.status(200).json({
      success: true,
      data: image.data,
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

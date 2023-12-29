const Replicate = require("replicate");

const replicate = new Replicate({
  auth: "r8_FtZoFtwyBPNhAkVDokPa8JPIBhIyGG44AiD5x",
});

// Wrap your code in an asynchronous function
async function fetchData() {
  try {
    const output = await replicate.run(
      "meta/llama-2-13b-chat:f4e2de70d66816a838a89eeeb621910adffb0dd0baba3976c96980970978018d",
      {
        input: {
          prompt: "Which is the fastest car in world",          
        },
      }
    );

    // Join the array elements into a string without extra spaces
    const formattedOutput = output.join(' ');
    console.log(formattedOutput);
  } catch (error) {
    // Handle any errors that occurred during the asynchronous operation
    console.error(error);
  }
}

// Call the asynchronous function
fetchData();

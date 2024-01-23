const express = require('express');
const app = express();

app.use(express.json());

const axios = require('axios'); // Make sure to install axios using npm install axios
const port = 3000;

app.post('/try', async (req, res) => {
    try {
        // Make a request to the /ask API
        const response = await axios.post('http://localhost:3000/ask'); // Replace with your actual API endpoint

        // Handle the response from the /ask API
        return res.json({
            message: 'Hello',
            secondApiMessage: response.data.message,
        });
    } catch (error) {
        // Handle errors if the request to /ask fails
        console.error('Error calling /ask API:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/ask', async (req, res) => {
    return res.json({ message: 'This is the second API' });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

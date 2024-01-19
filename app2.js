const { Firestore } = require('@google-cloud/firestore');
const { Console } = require('console');
const express = require('express');

const app = express();
const port = 3000;

app.use(express.json());


const firestore = new Firestore({
    projectId: 'howtotalktomyaiui',
    keyFilename: '/Users/sreelakshmi/Desktop/Raghul/openaiapi/howtotalktomyaiui-29134714127e.json',
  });

app.post('/try', async (req, res) => {
    try {
        const userTableRef = firestore.collection('OTP_table');
        console.log("LLLLLLLLL",userTableRef);
        try{
        const snapshot = await userTableRef.get();
        if (snapshot.empty) {
          console.log('No documents found in "user_table" collection.');
          return res.status(404).json({ error: 'No data found in the collection.' });
      }

      // Extract data from the first document in the collection
      const userData = snapshot.docs[0].data();
      console.log('Data retrieved successfully:', userData);

      return res.json({ userData });
        }catch (error) {
        console.error('Firestore query error:', error);
        return res.status(500).json({ error: 'Internal server error while querying Firestore.' });
      }          
    } catch (error) {
        console.error('Error retrieving data:', error);
        return res.status(500).json({ error: 'Internal server error while fetching data.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
  
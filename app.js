const express = require('express');
const admin = require('firebase-admin');
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");


// Replace the path to your Firebase project's private key JSON file
const serviceAccount = require('/Users/sreelakshmi/Desktop/Raghul/openaiapi/angularfsdev-firebase-adminsdk-qaq4n-b96b1f08c8.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://console.firebase.google.com/u/5/project/angularfsdev/' // Replace with your Firebase project's database URL
});

const app = express();
const port = 3000;

// Middleware to parse JSON in the request body
app.use(express.json());

////////////////////////////////////////////////////// 1.

// Define a route for adding a document to Firestore
app.post('/addUser', (req, res) => {
  const { first_name, Last_name, mail_id, Mobile_no} = req.body;
//  console.log(first_name);
//   if (!first_name || !mail_id || !Last_name) {
//     return res.status(400).json({ error: 'Name and email are required fields' });
//   }

  const db = admin.firestore();
  const collectionRef = db.collection('user_table')

  const userData = {
    first_name,
    Last_name,
    mail_id,
    Mobile_no,
  }

  collectionRef.add(userData)
    .then(() => {
      console.log('Document successfully written!');
      res.status(200).json({ message: 'Document successfully written!' });
    })
    .catch((error) => {
      console.error('Error writing document: ', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

/////////////////////////////////////// 2.


app.post('/sendotp', (req, res) => {
  const { mail_id } = req.body;
  const db = admin.firestore();
  const collectionRef = db.collection('user_table');

  // Perform a query to check if the mail_id exists in the 'email' field
  collectionRef.where('mail_id', '==', mail_id).get()
    .then(snapshot => {
      if (snapshot.empty) {
        // No matching document found, the mail_id does not exist
        res.status(404).json({ message: 'Mail ID not found in the database' });
      } else {
        // Generate a random 6-digit OTP
    const otp = generateOTP(6);
    console.log(otp, "OTP"); 
    //const userDoc = snapshot.docs[0].data();
    const docRef = collectionRef.doc(snapshot.docs[0].id);
         docRef.update({
          OTP: otp
        });  

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "appstore@softcons.com",
            pass: "iwqthpotdqadkaaz",
        },
    });

    // Email content
    const mailOptions = {
        from: "appstore@softcons.com",
        to: "raghul.a1710@gmail.com",
        subject: "OTP Verification",
        text: `Your OTP is: ${otp}`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending OTP email:", error);
            return res.status(StatusCodes.InternalServerError).json("Error sending OTP email");
        } else {
            console.log("OTP email sent:", info.response);
            return res.json("OTP sent successfully");
        }   
    });
  }
    })
    .catch(error => {
      // Handle any errors that occurred during the query
      console.error('Error getting documents', error);
      res.status(500).json({ error: 'Internal server error' });
    });
});



/////////////////////////////////////////// 3.

const jwtSecret = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

app.post('/signin', async (req, res) => {
  try {
    const { mail_id, otp } = req.body;

    const db = admin.firestore();
    const collectionRef = db.collection('user_table');

    // Use where method to query based on mail_id
    const querySnapshot = await collectionRef.where('mail_id', '==', mail_id).get();

    // Check if there are any matching documents
    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Assuming there's only one matching document, you can access it like this
    const userDoc = querySnapshot.docs[0].data();
    const OTP = userDoc.OTP
    const first_name = userDoc.first_name
    const last_name = userDoc.last_name
    const mobile_no = userDoc.Mobile_no
    

    // Verify the user's credentials (e.g., comparing OTP)
    if(otp == OTP){

    // Create a payload to sign with a token
    const payload = {
        mail_id,
        first_name,
        last_name,
        OTP,
        mobile_no,      
    };

    // Sign the payload with a token
    const token = jwt.sign(payload, jwtSecret);

    // Send the token in the headers
    res.header('Authorization', `Bearer ${token}`);

    // You can also set the token in a cookie if you prefer
    // res.cookie('token', token, { httpOnly: true });

    // Send a success response without including the token in the body
    return res.json({ user: userDoc });
  }else{
    return res.json({ error: 'Invalid OTP' });
  }  
  } catch (error) {
    console.error('Error signing in:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

function generateOTP(length) {
  const charset = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      otp += charset[randomIndex];
  }
  return otp;
}


// Start the Express server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

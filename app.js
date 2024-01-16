const express = require('express');
const admin = require('firebase-admin');
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const cors = require('cors')
const { GoogleGenerativeAI } = require("@google/generative-ai");


// Replace the path to your Firebase project's private key JSON file
const serviceAccount = require('./angularfsdev-firebase-adminsdk-qaq4n-b96b1f08c8.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://console.firebase.google.com/u/5/project/angularfsdev/' // Replace with your Firebase project's database URL
});

const apiKey = "AIzaSyBXKKqql55PMGHSwWDiuoSmVNpAYiQ4W3c"; 
const genAI = new GoogleGenerativeAI(apiKey);

const app = express();
const port = 3000;

// Middleware to parse JSON in the request body
app.use(express.json());

//////////////////////////////////////////////////////0.

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

////////////////////////////////////////////////////// 1.

app.post('/signup1', async (req, res) => {
  try {
    const { mail_id } = req.body;
    const db = admin.firestore();
    const otpCollectionRef = db.collection('OTP_table');
    const otp = generateOTP(6);

    const querySnapshot = await otpCollectionRef.where('mail_id', '==', mail_id).get();

    if (querySnapshot.empty) {
      // If no document exists, add a new one
      const userData = {
        mail_id,
        otp,
      };
      await otpCollectionRef.add(userData);
    } else {
      // If document exists, update the existing one
      const existingDocId = querySnapshot.docs[0].id;
      const userData = {
        mail_id,
        otp,
      };
      await otpCollectionRef.doc(existingDocId).set(userData);
    }    
    sendmail(mail_id, otp);
    return res.json({ message: 'OTP Sent' });
  } catch (error) {
    console.error('Error signing in:', error);
    return res.status(500).json({ error: 'Internal server error OTP not sent' });
  }
});
 
////////////////////////////////////////2.

app.post('/signup2', async (req, res) => {
  try {
    const { mail_id, otp, first_name, Last_name, Mobile_no } = req.body;

    const db = admin.firestore();
    const otpCollectionRef = db.collection('OTP_table');
    const userCollectionRef = db.collection('user_table');
    const querySnapshot1 = await userCollectionRef.where('mail_id', '==', mail_id).get();
    if (!querySnapshot1.empty) {
      // If documents exist, it means the mail_id is already in the database
      return res.json({ error: 'User already exists' });
    }
    // Use where method to query based on mail_id in 'OTP_table'
    const querySnapshot = await otpCollectionRef.where('mail_id', '==', mail_id).get();

    // Check if there are any matching documents in 'OTP_table'
    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    } else {
      const inf = querySnapshot.docs[0].data();
      const userotp = inf.otp;
      console.log("UserOtp", userotp);

      if (otp == userotp) {
        const verification_status = true;
        const userData = {
          first_name,
          Last_name,
          mail_id,
          Mobile_no,
          verification_status
        }
        // Update verification_status in 'user_table'
        userCollectionRef.add(userData)          
          return res.status(200).json({ message: 'VALID OTP!!' });         
      } else {
        console.error('INVALID OTP');
        return res.status(500).json({ error: 'INVALID OTP' });
      }
    }
  } catch (error) {
    console.error('Error signing in:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


/////////////////////////////////////////// 3.

app.post('/signin1', async (req, res) => {
  try {
    const { mail_id } = req.body;
    const db = admin.firestore();
    const userCollectionRef = db.collection('user_table');
    const querySnapshot2 = await userCollectionRef.where('mail_id', '==', mail_id).get();
    const otp = generateOTP(6);

    // Check if document with the specified mail_id exists
    const otpCollectionRef = db.collection('Signin_OTP_table');
    const querySnapshot = await otpCollectionRef.where('mail_id', '==', mail_id).get();

    if(querySnapshot2.empty){
      return res.json({
        error : 'User has not enrolled'
      })
    }else{

    if (querySnapshot.empty) {
      // If no document exists, add a new one
      const userData = {
        mail_id,
        otp,
      };
      await otpCollectionRef.add(userData);
    } else {
      // If document exists, update the existing one
      const existingDocId = querySnapshot.docs[0].id;
      const userData = {
        mail_id,
        otp,
      };
      await otpCollectionRef.doc(existingDocId).set(userData);
    }

    sendmail(mail_id, otp);
    return res.json({ message: 'OTP Sent' });
  }
 } catch (error) {
    console.error('Error signing in:', error);
    return res.status(500).json({ error: 'Internal server error OTP not sent' });
  }
});

///////////////////////////////////////////////4.

const jwtSecret = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

app.post('/signin2', async (req, res) => {
  try {
    const { mail_id, otp } = req.body;

    const db = admin.firestore();
    const collectionRef = db.collection('user_table');
    const OTP = db.collection('Signin_OTP_table');

    // Use where method to query based on mail_id
    const querySnapshot = await collectionRef.where('mail_id', '==', mail_id).get();

    // Check if there are any matching documents in user_table
    if (querySnapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Assuming there's only one matching document, you can access it like this
    const userDoc = querySnapshot.docs[0].data();
    const status = userDoc.verification_status;

    if (status == true) {
      // Check if there's a corresponding OTP in Signin_OTP_table
      const SigninCollectionRef = await OTP.where('mail_id', '==', mail_id).get();

      if (SigninCollectionRef.empty) {
        return res.status(404).json({ error: 'User not found in Signin_OTP_table' });
      }

      // Assuming there's only one matching document, you can access it like this
      const userotp = SigninCollectionRef.docs[0].data();
      const actualOTP = userotp.otp;
      console.log("Actual OTP", actualOTP);
      console.log("Actual OTP", mail_id);

      // Verify the user's credentials (e.g., comparing OTP)
      if (otp == actualOTP) {
        // Create a payload to sign with a token
        const payload = {
          mail_id,
          first_name: userDoc.first_name,
          last_name: userDoc.last_name,
          OTP: actualOTP,
          mobile_no: userDoc.Mobile_no,
        };

        // Sign the payload with a token
        const token = jwt.sign(payload, jwtSecret);

        // Send the token in the headers
        res.header('Authorization', `Bearer ${token}`);

        // Send a success response without including the token in the body
        return res.json({ user: userDoc });
      } else {
        return res.json({ error: 'Invalid OTP' });
      }
    } else {
      return res.status({ message: 'Not a verified user' });
    }
  } catch (error) {
    console.error('Error signing in:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


////////////////////// Function to generate OTP

function generateOTP(length) {
  const charset = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      otp += charset[randomIndex];
  }
  return otp;
}

////////////////////// Function to send mail


function sendmail(mail_id,otp){

  // const otp = generateOTP(6);
  //     console.log(otp, "OTP"); 
      //const userDoc = snapshot.docs[0].data();
      // const docRef = collectionRef.doc(snapshot.docs[0].id);
      //     docRef.update({
      //       OTP: otp
      //     });  

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

    transporter.sendMail(mailOptions);

  }    


// Start the Express server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


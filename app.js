const express = require('express');
const admin = require('firebase-admin');
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const cors = require('cors')
const { GoogleGenerativeAI } = require("@google/generative-ai");
const TokenManager = require("./token");



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

app.use(express.json());

// GEMINI API

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

// Signup using Mailid

app.post('/signup', async (req, res) => {
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
 
// Signup Screen {OTP along with user details}

app.post('/signupotp', async (req, res) => {
  try {
    const { mail_id, otp, first_name, Last_name, Mobile_no, User_id } = req.body;

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
          verification_status,
          User_id
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


// Signin using Mailid

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

// Signin with OTP

app.post('/signinotp', async (req, res) => {
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
        const payloadd = {
          mail_id,
          first_name: userDoc.first_name,
          Last_name: userDoc.Last_name,
          User_id: userDoc.User_id
        };

        // Sign the payload with a token
        const token = TokenManager.signToken(payloadd, { audience: 'your-audience' });
        // Send the token in the headers
        res.header('Authorization', `Bearer ${token}`);
        const generated_token = `Bearer ${token}`;
        console.log("Token:", generated_token);

        const dec = TokenManager.decodeToken(generated_token)
        console.log(dec);

        const response = {
          generated_token,
          userDoc
        }


        // Send a success response without including the token in the body
        return res.json(response);
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

app.post('/tokenverify', async (req, res) => {
  try {
    const token = req.get('val'); 
    console.log(token);

    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing' });
    }

    const decodedToken = TokenManager.decodeToken(token);
    const mail = decodedToken.payload.email_id;
    const first_name = decodedToken.payload.first_name;
    const Last_name = decodedToken.payload.Last_name;
    const User_id = decodedToken.payload.User__id;

    const Userdata = {
      mail,first_name,Last_name,User_id
    }

    console.log("Mail", mail);
    console.log(decodedToken);
    const db = admin.firestore();
    const userCollectionRef = db.collection('user_table');
    const querySnapshot1 = await userCollectionRef.where('mail_id', '==', mail).get();
    if (querySnapshot1.empty) {
      // If documents exist, it means the mail_id is already in the database
      return res.json({ error: 'User never exists' });
    }else{
    res.status(200).json(Userdata);
  }
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// OTP Generation

function generateOTP(length) {
  const charset = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      otp += charset[randomIndex];
  }
  return otp;
}

// Sending mail through Nodemailer


function sendmail(mail_id,otp){

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


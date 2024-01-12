const firebase = require("firebase");
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyC7x3OWOQNCFRKd5agXgXtgr_k2p0U6tSM",
    authDomain: "angularfsdev.firebaseapp.com",
    projectId: "angularfsdev",
    storageBucket: "angularfsdev.appspot.com",
    messagingSenderId: "732989509182",
    appId: "1:732989509182:web:d6cf30627da82f9e1a0b6f",
    measurementId: "G-7Q8EY8DSRR"
  };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const User = db.collection("Users");
module.exports = User;
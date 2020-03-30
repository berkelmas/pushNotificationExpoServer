const functions = require("firebase-functions");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const { firebaseAdminMiddleware } = require("./utils/firebaseAdminMiddleware");
firebaseAdminMiddleware();

app
  .use(cors({ origin: true }))
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .use("/", require("./routes/mainRoutes"))
  .get("*", (req, res) =>
    res.status(404).json({ status: false, data: "Endpoint not found." })
  );

const api = functions.https.onRequest(app);
module.exports.sendPushNotification = api;

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.sendPushNotification = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

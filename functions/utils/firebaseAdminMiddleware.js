const admin = require("firebase-admin");
const serviceAccount = require("../credentials/sezinework-firebase-adminsdk-vjog2-26c222df1f.json");

const firebaseAdminMiddleware = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sezinework.firebaseio.com"
  });
};

module.exports = { firebaseAdminMiddleware };

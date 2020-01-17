const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const { firebaseAdminMiddleware } = require("./utils/firebaseAdminMiddleware");
firebaseAdminMiddleware();

app
  .use(cors({ origin: true }))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: false }))
  .use("/", require("./routes/mainRoutes"))
  .get("*", (req, res) =>
    res.status(404).json({ status: false, data: "Endpoint not found." })
  );

app.listen(2000, () => console.log("SERVER ACILDI..."));

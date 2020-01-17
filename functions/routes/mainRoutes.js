const router = require("express").Router();
const mainControllers = require("../controllers/mainControllers");

router.post("/save", mainControllers.saveUserIdWithDeviceId);
router.post("/sendNotification", mainControllers.sendNotification);

module.exports = router;

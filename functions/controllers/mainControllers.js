const admin = require("firebase-admin");
// EXPO SDK FOR PUSH TOKEN
const { Expo } = require("expo-server-sdk");

const sendNotification = (req, res) => {
  let expo = new Expo();

  // PUSH NOTIFICATION DATA MUST BE VALID JAVASCRIPT OBJECT.
  const {
    pushTokens,
    pushNotificationMessage,
    pushNotificationData
  } = req.body;

  // Create the messages that you want to send to clents
  let messages = [];
  for (let pushToken of pushTokens) {
    // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return res.json({
        status: "Does not appear all psuh tokens to be valid."
      });
    }

    // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications)
    messages.push({
      to: pushToken,
      sound: "default",
      body: pushNotificationMessage,
      data: pushNotificationData
    });
  }

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
      } catch (error) {
        console.error(error);
        res.json({ status: "ERROR SENDING PUSH NOTIFICATIONS" });
      }
    }
  })();

  // Later, after the Expo push notification service has delivered the
  // notifications to Apple or Google (usually quickly, but allow the the service
  // up to 30 minutes when under load), a "receipt" for each notification is
  // created. The receipts will be available for at least a day; stale receipts
  // are deleted.
  //
  // The ID of each receipt is sent back in the response "ticket" for each
  // notification. In summary, sending a notification produces a ticket, which
  // contains a receipt ID you later use to get the receipt.
  //
  // The receipts may contain error codes to which you must respond. In
  // particular, Apple or Google may block apps that continue to send
  // notifications to devices that have blocked notifications or have uninstalled
  // your app. Expo does not control this policy and sends back the feedback from
  // Apple and Google so you can handle it appropriately.
  let receiptIds = [];
  for (let ticket of tickets) {
    // NOTE: Not all tickets have IDs; for example, tickets for notifications
    // that could not be enqueued will have error information and no receipt ID.
    if (ticket.id) {
      receiptIds.push(ticket.id);
    }
  }

  let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  (async () => {
    // Like sending notifications, there are different strategies you could use
    // to retrieve batches of receipts from the Expo service.
    for (let chunk of receiptIdChunks) {
      try {
        let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log(receipts);

        // The receipts specify whether Apple or Google successfully received the
        // notification and information about an error, if one occurred.
        for (let receipt of receipts) {
          if (receipt.status === "ok") {
            continue;
          } else if (receipt.status === "error") {
            console.error(
              `There was an error sending a notification: ${receipt.message}`
            );
            if (receipt.details && receipt.details.error) {
              // The error codes are listed in the Expo documentation:
              // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
              // You must handle the errors appropriately.
              console.error(`The error code is ${receipt.details.error}`);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  })();
};

const saveUserIdWithDeviceId = (req, res) => {
  const { userId, pushToken } = req.body;
  const newItem = { userId, pushToken };

  admin
    .firestore()
    .collection("messages")
    .where("pushToken", "==", pushToken)
    .get()
    .then(item => {
      if (item.empty) {
        admin
          .firestore()
          .collection("messages")
          .add(newItem)
          .then(writeResult => {
            console.log(writeResult);
            return res.json(writeResult);
          })
          .catch(err => res.json({ status: "not successful" }));
      } else {
        let items = [];
        item.forEach(doc => {
          admin
            .firestore()
            .collection("messages")
            .doc(doc.id)
            .set(newItem)
            .then(res => {
              return res.json(res);
            })
            .catch(err => res.json({ status: "failed" }));
        });
        res.json(items);
      }
    })
    .catch(err => res.json({ status: "failed" }));
};

module.exports = { sendNotification, saveUserIdWithDeviceId };

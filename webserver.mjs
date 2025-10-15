// mini-chat/webserver.js
import express from "express";
const app = express();

app.use(express.static(".")); // serve current folder

app.listen(5500, "127.0.0.1", () =>
  console.log("🌐 Chat site running at http://127.0.0.1:5500")
);

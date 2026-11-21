"use strict";

const express = require("express");
const path = require("path");

const app = express();
const publicDirectory = path.join(__dirname, "public");

app.disable("x-powered-by");

app.get("/healthz", (req, res) => {
  res.status(200).send("ok");
});

app.use(express.static(publicDirectory));

const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Wave Gate is listening on port ${port}`);
});

import express from "express";
import cors from "cors";
import fetchImageRoute from "./routes/fetchimage.route.js";
import dotenv from "dotenv";
import aivoicebotRoute from "./routes/aiassistantvoicebot.route.js";
import mongoose from "mongoose";
import { app, server } from "./socket/socket.js";

mongoose
  .connect(process.env.MONGO_URL)
  .then((res) => {
    console.log("DataBase Connected");
  })
  .catch((err) => {
    console.log(err);
  });

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ROUTES FOR IMAGE FETCHING */
app.use("/v1", fetchImageRoute);

/* ROUTES OF AI BOT */
app.use("/v1", aivoicebotRoute);

server.listen(8001, () => {
  console.log("Server is Listening");
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});

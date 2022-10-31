require("dotenv/config");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const routes = require("./routes/index");
const PORT = process.env.PORT || 8000;
app.use(express.json());
app.use(routes);
mongoose
  .connect(process.env.MONGOURL)
  .then(() => {
    console.log("connected sucessfully to the database");
  })
  .catch((e) => {
    console.log(e);
  });
app.listen(PORT, () => {
  console.log("Server is running on port: ", PORT);
});

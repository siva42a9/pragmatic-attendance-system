const attendanceRoutes = require("./routes/attendanceRoutes");
const locationRoutes = require("./routes/locationRoutes");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({
    origin: "*"
}));

app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", attendanceRoutes);
app.use("/api", locationRoutes);

app.use(express.static("public"));

console.log("API Routes Registered");

app.get("/", async (req, res) => {

    try {

        const result = await pool.query("SELECT NOW()");

        res.json({

            message: "Database Connected Successfully ✅",

            time: result.rows[0].now

        });

    }

    catch(err){

        res.status(500).json({

            error: err.message

        });

    }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{

    console.log(`🚀 Server running on Port ${PORT}`);

});
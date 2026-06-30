const pool = require("../config/db");

const getLocations = async (req, res) => {

    try {

        const result = await pool.query(
            "SELECT * FROM locations WHERE status = true"
        );

        res.json(result.rows);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });

    }

};

module.exports = { getLocations };
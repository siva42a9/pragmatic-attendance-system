const pool = require("../config/db");

const login = async (req, res) => {
  const { employee_id, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM employees WHERE employee_id = $1 AND password = $2",
      [employee_id, password]
    );

    if (result.rows.length > 0) {
      res.json({
        success: true,
        user: result.rows[0],
      });
    } else {
      res.json({
        success: false,
        message: "Invalid Employee ID or Password",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message,
    });
  }
};

module.exports = { login };
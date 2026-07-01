const pool = require("../config/db");
const supabase = require("../config/supabase");
const crypto = require("crypto");

// ======================================
// CHECK IN
// ======================================

const checkIn = async (req, res) => {

    console.log("===== CHECK IN API CALLED =====");

    const {
        employee_id,
        latitude,
        longitude,
        accuracy,
        location_type,
        site_name,
        checkin_selfie_url
    } = req.body;

    try {

        const employee = await pool.query(
            "SELECT full_name FROM employees WHERE employee_id = $1",
            [employee_id]
        );

        if (employee.rows.length === 0) {

            return res.status(404).json({
                success: false,
                error: "Employee Not Found"
            });

        }

        const employee_name = employee.rows[0].full_name;

        console.log("Employee:", employee_name);

        // Already checked in?
        const alreadyChecked = await pool.query(
            `SELECT * FROM attendance
             WHERE employee_id = $1
             AND attendance_date = CURRENT_DATE`,
            [employee_id]
        );

        if (alreadyChecked.rows.length > 0) {

            return res.json({
                success: false,
                error: "You have already checked in today."
            });

        }

        let savedImagePath = null;

        // ===============================
        // Upload Check-In Selfie
        // ===============================

        if (checkin_selfie_url) {

            const base64Data = checkin_selfie_url.replace(
                /^data:image\/\w+;base64,/,
                ""
            );

            const buffer = Buffer.from(base64Data, "base64");

            const fileName =
                `${employee_id}_IN_${crypto.randomUUID()}.jpg`;

            const { error } = await supabase.storage
                .from("selfies")
                .upload(fileName, buffer, {
                    contentType: "image/jpeg"
                });

            if (error) {

                throw error;

            }

            const { data } = supabase.storage
                .from("selfies")
                .getPublicUrl(fileName);

            savedImagePath = data.publicUrl;

        }

        await pool.query(

            `INSERT INTO attendance
            (
                employee_id,
                employee_name,
                attendance_date,
                in_time,
                latitude,
                longitude,
                accuracy,
                location_type,
                site_name,
                checkin_selfie_url,
                status
            )
            VALUES
            (
                $1,
                $2,
                CURRENT_DATE,
                CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata',
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                'Present'
            )`,

            [
                employee_id,
                employee_name,
                latitude,
                longitude,
                accuracy,
                location_type,
                site_name,
                savedImagePath
            ]

        );

        return res.json({

            success: true,

            message: "Check IN Successful ✅"

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// ======================================
// CHECK OUT
// ======================================

const checkOut = async (req, res) => {

    console.log("===== CHECK OUT API CALLED =====");

    const {
        employee_id,
        latitude,
        longitude,
        accuracy,
        location_type,
        site_name,
        checkout_selfie_url
    } = req.body;

    try {

        const attendance = await pool.query(

            `SELECT *
             FROM attendance
             WHERE employee_id = $1
             AND attendance_date = CURRENT_DATE`,

            [employee_id]

        );

        if (attendance.rows.length === 0) {

            return res.json({

                success: false,

                error: "You haven't checked in today."

            });

        }

        if (attendance.rows[0].out_time) {

            return res.json({

                success: false,

                error: "Already Checked Out."

            });

        }

        let savedImagePath = null;

        // ===============================
        // Upload Check-Out Selfie
        // ===============================

        if (checkout_selfie_url) {

            const base64Data = checkout_selfie_url.replace(

                /^data:image\/\w+;base64,/,

                ""

            );

            const buffer = Buffer.from(base64Data, "base64");

            const fileName =
                `${employee_id}_OUT_${crypto.randomUUID()}.jpg`;

            const { error } = await supabase.storage

                .from("selfies")

                .upload(fileName, buffer, {

                    contentType: "image/jpeg"

                });

            if (error) {

                throw error;

            }

            const { data } = supabase.storage

                .from("selfies")

                .getPublicUrl(fileName);

            savedImagePath = data.publicUrl;

        }

        // ===============================
        // UPDATE ATTENDANCE
        // ===============================

        await pool.query(

            `UPDATE attendance
             SET
                out_time = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata',
                latitude = $1,
                longitude = $2,
                accuracy = $3,
                location_type = $4,
                site_name = $5,
                checkout_selfie_url = $6
             WHERE employee_id = $7
             AND attendance_date = CURRENT_DATE`,

            [

                latitude,
                longitude,
                accuracy,
                location_type,
                site_name,
                savedImagePath,
                employee_id

            ]

        );

        return res.json({

            success: true,

            message: "Checked Out Successfully ✅"

        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            error: err.message

        });

    }

};

// ======================================
// EXPORT FUNCTIONS
// ======================================

module.exports = {

    checkIn,

    checkOut

};
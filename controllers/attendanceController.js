const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const supabase = require("../config/supabase");
const crypto = require("crypto");

const checkIn = async (req, res) => {
    console.log("===== CHECK IN API CALLED =====");

    const {
        employee_id,
        latitude,
        longitude,
        accuracy,
        location_type,
        site_name,
        selfie_url
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

console.log("Employee ID:", JSON.stringify(employee_id));
console.log("Employee Query:", employee.rows);
console.log("Employee Name:", employee_name);

let savedImagePath = null;

if (selfie_url) {

    // Remove Base64 header
    const base64Data = selfie_url.replace(
        /^data:image\/\w+;base64,/,
        ""
    );

    // Convert to Buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Unique File Name
    const fileName =
        `${employee_id}_${crypto.randomUUID()}.jpg`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage

        .from("selfies")

        .upload(fileName, buffer, {

            contentType: "image/jpeg"

        });

    if (error) {

        throw error;

    }

    // Public URL
    const { data } = supabase.storage

        .from("selfies")

        .getPublicUrl(fileName);

    savedImagePath = data.publicUrl;

}

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
        selfie_url,
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

        res.json({
            success: true,
            message: "Check IN Successful ✅"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

};

const checkOut = async (req, res) => {

    const {

        employee_id,
        latitude,
        longitude,
        accuracy,
        location_type,
        site_name,
        selfie_url

    } = req.body;

    try {

        const attendance = await pool.query(

            `SELECT *
             FROM attendance
             WHERE employee_id=$1
             AND attendance_date=CURRENT_DATE`,

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

        let savedImagePath = attendance.rows[0].selfie_url;

        if (selfie_url) {

            const base64Data = selfie_url.replace(
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

            if (error) throw error;

            const { data } = supabase.storage

                .from("selfies")

                .getPublicUrl(fileName);

            savedImagePath = data.publicUrl;

        }

        await pool.query(

            `UPDATE attendance

             SET

             out_time=CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata',

             latitude=$1,

             longitude=$2,

             accuracy=$3,

             location_type=$4,

             site_name=$5,

             selfie_url=$6

             WHERE employee_id=$7

             AND attendance_date=CURRENT_DATE`,

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

        res.json({

            success: true,

            message: "Checked Out Successfully"

        });

    }

    catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            error:err.message

        });

    }

};

module.exports = {

    checkIn,

    checkOut

};
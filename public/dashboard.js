const checkinBtn = document.getElementById("checkinBtn");
const checkoutBtn = document.getElementById("checkoutBtn");
const msg = document.getElementById("msg");

const radios = document.getElementsByName("locationType");
const siteBox = document.getElementById("siteBox");

const cameraSection = document.getElementById("cameraSection");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("captureBtn");

let stream;
let attendanceData = null;

// ======================================
// SHOW / HIDE SITE NAME BOX
// ======================================

radios.forEach((radio) => {

    radio.addEventListener("change", () => {

        if (radio.checked && radio.value === "Site") {

            siteBox.style.display = "block";

        } else {

            siteBox.style.display = "none";

        }

    });

});

// ======================================
// DISTANCE CALCULATOR
// ======================================

function getDistance(lat1, lon1, lat2, lon2) {

    const R = 6371000;

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;

}

// ======================================
// LOAD LOCATIONS
// ======================================

async function getLocations() {

    const response = await fetch("/api/locations")

    return await response.json();

}

// ======================================
// MAIN ATTENDANCE FUNCTION
// ======================================

async function performAttendance(action) {

    if (!navigator.geolocation) {

        alert("Geolocation Not Supported");

        return;

    }

    msg.innerHTML = "📍 Getting Location...";

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            const { latitude, longitude, accuracy } = position.coords;

            const location_type =
    document.querySelector(
        'input[name="locationType"]:checked'
    ).value;

let site_name = null;

if (location_type === "Site") {

    site_name = document.getElementById("siteName").value.trim();

    if (site_name === "") {

        alert("Please Enter Site Name");

        return;

    }

}




            if (accuracy > 200) {

                alert("GPS Accuracy Too Low");

                return;
            }

let matchedDistance = 0;

if (location_type === "Office") {

    const locations = await getLocations();

    let matchedLocation = null;

    for (const location of locations) {

        const distance = getDistance(

            latitude,
            longitude,
            parseFloat(location.latitude),
            parseFloat(location.longitude)

        );

        if (distance <= location.radius) {

            matchedLocation = location;
            matchedDistance = distance;

            break;

        }

    }

    if (!matchedLocation) {

        alert("❌ You are outside Office Location");

        return;

    }

}

            msg.innerHTML = `
                <h3>✅ Location Verified</h3>

                <b>Latitude :</b> ${latitude}<br><br>

                <b>Longitude :</b> ${longitude}<br><br>

                <b>Accuracy :</b> ${accuracy.toFixed(2)} meters<br><br>

                <b>Distance :</b> ${matchedDistance.toFixed(2)} meters
            `;

            attendanceData = {

                employee_id: localStorage.getItem("employee_id"),

                latitude,

                longitude,

                accuracy,

                location_type,

                site_name,

                selfie_url: null,

                action

            };

            await openCamera();

        },

        (error) => {

            switch (error.code) {

                case error.PERMISSION_DENIED:
                    alert("❌ Location Permission Denied");
                    break;

                case error.POSITION_UNAVAILABLE:
                    alert("❌ Location Unavailable");
                    break;

                case error.TIMEOUT:
                    alert("❌ Location Request Timed Out");
                    break;

                default:
                    alert("❌ Unknown Location Error");

            }

        },

        {

            enableHighAccuracy: true,

            timeout: 30000,

            maximumAge: 60000

        }

    );

}

// ======================================
// OPEN CAMERA
// ======================================

async function openCamera() {

    try {

        stream = await navigator.mediaDevices.getUserMedia({

            video: {

                facingMode: "user"

            }

        });

        video.srcObject = stream;

        cameraSection.style.display = "block";

    }

    catch (err) {

        console.error(err);

        alert("❌ Camera Permission Denied");

    }

}

// ======================================
// SAVE CHECK-IN
// ======================================

async function saveAttendance() {

    try {

        const response = await fetch("/api/checkin",

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(attendanceData)

            }

        );

        const data = await response.json();

        if (data.success) {

            alert("✅ Check-In Successful");

            msg.innerHTML +=
                "<br><br><b style='color:green;'>Check-In Saved Successfully</b>";

        }

        else {

            alert(data.error || "Check-In Failed");

        }

    }

    catch (err) {

        console.error(err);

        alert("Server Error");

    }

}

// ======================================
// SAVE CHECK-OUT
// ======================================

async function saveCheckout() {

    try {

        const response = await fetch("/api/checkout", {

            method: "POST",

            headers: {

                "Content-Type": "application/json"

            },

            body: JSON.stringify(attendanceData)

        });

        const data = await response.json();

        if (data.success) {

            alert("✅ Check-Out Successful");

            msg.innerHTML +=
                "<br><br><b style='color:red;'>Check-Out Saved Successfully</b>";

        } else {

            alert(data.error || "Check-Out Failed");

        }

    } catch (err) {

        console.error(err);

        alert("Server Error");

    }

}



// ======================================
// CAPTURE SELFIE
// ======================================

captureBtn.addEventListener("click", async () => {

    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    attendanceData.selfie_url = canvas.toDataURL("image/jpeg", 0.8);

    if (stream) {

        stream.getTracks().forEach(track => track.stop());

    }

    cameraSection.style.display = "none";

    if (attendanceData.action === "CHECKIN") {

        await saveAttendance();

    } else {

        await saveCheckout();

    }

});

// ======================================
// CHECK IN BUTTON
// ======================================

checkinBtn.addEventListener("click", () => {

    console.log("CHECK IN CLICKED");

    performAttendance("CHECKIN");

});

// ======================================
// CHECK OUT BUTTON
// ======================================

checkoutBtn.addEventListener("click", () => {

    console.log("CHECK OUT CLICKED");

    performAttendance("CHECKOUT");

});
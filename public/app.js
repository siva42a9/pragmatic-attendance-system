const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
    const employee_id = document.getElementById("employee_id").value;
    const password = document.getElementById("password").value;

    try {

        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                employee_id,
                password
            })
        });

        const data = await response.json();

        console.log(data);

        if (data.success) {

    // 👇 Employee ID ni browser lo save chestundi
    localStorage.setItem("employee_id", data.user.employee_id);

    alert("✅ Login Success");

    window.location.href = "dashboard.html";

} else {
            document.getElementById("msg").innerText = data.message;
        }

    } catch (err) {
        console.error(err);
        document.getElementById("msg").innerText = "Server Error";
    }
});
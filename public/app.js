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
    localStorage.setItem("employee_name", data.user.full_name);

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

const bubbleContainer = document.getElementById("backgroundBubbles");

if (bubbleContainer) {

    for (let i = 0; i < 60; i++) {

        const bubble = document.createElement("span");

        bubbleContainer.appendChild(bubble);

        bubble.style.left = Math.random() * 100 + "%";

        const size = Math.random() * 45 + 20;

        bubble.style.width = size + "px";
        bubble.style.height = size + "px";

        bubble.style.animationDuration =
            (Math.random() * 12 + 8) + "s";

        bubble.style.animationDelay =
            Math.random() * 12 + "s";
    }

}
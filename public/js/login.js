document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("message");
    const loginData = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };
    try{
        const data =await apiFetch("/api/login", {
            method: "POST",
            body: JSON.stringify(loginData),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/posts.html";
    } catch (error){
        message.textContent = error.message;
    }
});
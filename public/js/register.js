document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("message");
    const userData = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };
    try{
        const data =await apiFetch("/api/register", {
        method: "POST",
        body: JSON.stringify(userData),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    window.location.href = "/posts.html";
    } catch (error){
        message.textContent = error.message;
    }
});
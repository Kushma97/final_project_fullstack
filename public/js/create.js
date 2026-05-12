protectPage();
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('message');
    const form = document.getElementById('postForm');
    const formData = new FormData(form);
    try{
        await apiFetch("/api/posts", {
            method: "POST",
            body: formData
        });
        window.location.href = "/my-posts.html";
    }catch (error){
        message.textContent = error.message;
    }
});

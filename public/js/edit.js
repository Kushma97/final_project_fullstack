protectPage();
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

async function loadPostForEdit() {
    const post = await apiFetch(`/api/posts/${postId}`);
    document.getElementById("title").value = post.title;
    document.getElementById("description").value = post.description;
    document.getElementById("tags").value = post.tags;
}
document.getElementById("postForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = document.getElementById("message");
    const form = document.getElementById("postForm");
    const formData = new FormData(form);
    try{
        await apiFetch(`/api/posts/${postId}`, {
            method: "PUT",
            body: formData
        });
        window.location.href = "/my-posts.html";
    } catch (error){
        message.textContent = error.message;
    }
});
document.addEventListener("DOMContentLoaded", loadPostForEdit);

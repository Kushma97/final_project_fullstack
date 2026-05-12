protectPage();
async function loadMyPosts() {
    const grid = document.getElementById("postsGrid");
    const posts = await apiFetch("/api/my-posts");
    grid.innerHTML = "";
    if (posts.length === 0){
        grid.innerHTML = "<p>You haven't created any posts yet.</p>";
        return;
    }
    posts.forEach(post => {
        grid.innerHTML += makePostCard(post, true);
    }); 
}
async function deletePost(id) {
    if (!confirm("Are you sure you want to delete this post?")){
        return;
    }
    try{
        await apiFetch(`/api/posts/${id}`, {
            method:"DELETE"
        });
        loadMyPosts();
    } catch (error){
        alert(error.message);
    }
    
}
document.addEventListener("DOMContentLoaded", loadMyPosts);



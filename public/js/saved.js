protectPage();

async function loadSavedPosts() {
    const grid = document.getElementById("postsGrid");
    const posts = await apiFetch("/api/saved-posts");
    grid.innerHTML = "";
    if (posts.length === 0){
        grid.innerHTML = "<p>You haven't saved any posts yet.</p>";
        return;
    }
    posts.forEach(post => {
        grid.innerHTML += makePostCard(post, false);
    }); 
}

document.addEventListener("DOMContentLoaded", loadSavedPosts);


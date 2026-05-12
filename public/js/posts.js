async function loadPosts(){
    const grid = document.getElementById("postsGrid");
    const tag = document.getElementById("tagFilter")?.value || "";
    const search = document.getElementById("searchInput")?.value || "";

    const params = new URLSearchParams();

    if (tag) {params.append("tag", tag);}
    if (search) {params.append("search", search);}
    try{
        const posts = await apiFetch(`/api/posts?${params.toString()}`);
        grid.innerHTML = "";

        if (!Array.isArray(posts)){
            grid.innerHTML = "<p>Error loading posts.</p>";
            return;
        }
        if (posts.length === 0){
            grid.innerHTML = "<p>No posts found.</p>";
            return;
        }
        posts.forEach(post => {
            grid.innerHTML += makePostCard(post);
    });
} catch (error){
    grid.innerHTML = `<p>${error.message}</p>`;
}
}
   

function makePostCard(post, showOwnerButtons = false){
    const tagHtml = post.tags.split(",").map(tag => `<span class="tag">${tag.trim()}</span>`).join(" ");
    return `
    <div class="card">
    <img src="${post.imageUrl}" alt="${post.title}" onclick = "openLightbox('${post.imageUrl}')">
    <div class="card-content">
        <h3>${post.title}</h3>
        <p>${post.description}</p>
        <p><strong>Tags:</strong> ${tagHtml}</p>
        ${post.username ? `<p><strong> Posted by:</strong> ${post.username}</p>` : ""}
        ${post.likeCount !== undefined ? `<p><strong>Likes:</strong> ${post.likeCount}</p>` : ""}
        <div class="actions">
            ${isLoggedIn() ? `<button class="btn" onclick="likePost('${post._id}')">Like</button>
            <button class="btn" onclick="savePost('${post._id}')">Save</button>` : ""}
            ${showOwnerButtons ? `
                <a class="btn" href="/edit.html?id=${post._id}">Edit</a>
                <button class="btn" onclick="deletePost('${post._id}')">Delete</button>
            ` : ""}
            </div>
    </div>
</div>
    `;
}
async function likePost(id) {
    try{
        await apiFetch(`/api/posts/${id}/like`, {
            method: "POST"
        });
        alert("Post liked!");
        loadPosts();
    } catch (error){
        alert(error.message);
    }   
    
}

async function savePost(id) {
    try{
        await apiFetch(`/api/posts/${id}/save`, {
            method: "POST"
        });
        alert("Post saved!");
    } catch (error){
        alert(error.message);
    }   
}
function openLightbox(imageUrl){
    const lightbox = document.getElementById("lightbox");
    const image = document.getElementById("lightboxImage");
    if (!lightbox || !image) 
        return;
    image.src = imageUrl;
    lightbox.style.display = "flex";
}
function closeLightbox(){
    const lightbox = document.getElementById("lightbox");
    const image = document.getElementById("lightboxImage");
    if (!lightbox || !image) 
        return;
    image.src = "";
    lightbox.style.display = "none";
}
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("postsGrid")){
        loadPosts();
    }
    document.getElementById("searchBtn")?.addEventListener("click", loadPosts);
    document.getElementById("clearBtn")?.addEventListener("click", () => {
        document.getElementById("searchInput").value = "";
        document.getElementById("tagFilter").value = "";
        loadPosts();
    });
    document.getElementById("tagFilter")?.addEventListener("change", loadPosts);
    document.getElementById("searchInput")?.addEventListener("input", loadPosts);
    document.getElementById("lightbox")?.addEventListener("click", (e) => {
        if(e.target.id === "lightbox"){
            closeLightbox();
        }
    }); 
});



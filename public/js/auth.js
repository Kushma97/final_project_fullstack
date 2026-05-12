function getToken(){
    return localStorage.getItem('token');
}
function getUser(){
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user): null;
}
function isLoggedIn(){
    return !!getToken();
}
function logout(){
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = "/";
}
function protectPage(){
    if (!isLoggedIn()){
        window.location.href = "/login.html";
    }
}
function updateNav(){
    const nav = document.querySelector('nav');
    if (!nav) return;
    if (isLoggedIn()){
        const user = getUser();
        nav.innerHTML = `<a href="/">Home</a>
        <a href="/posts.html">Browse</a>
        <a href="/create.html">Create</a>
        <a href="/my-posts.html">My Posts</a>
        <a href="/saved.html">Saved</a>
        <span>Hiiiii, ${user.username}</span>
        <button onclick="logout()">Logout</button>
        `;
    } else{
        nav.innerHTML = `<a href="/">Home</a>
         <a href="/posts.html">Browse</a>
        <a href="/register.html">Register</a>
        <a href="/login.html">Login</a>
        `;
    }
}

async function apiFetch(url, options ={}){
    const token = getToken();
    const headers = {
        ...(options.headers || {})
    };
    if (!(options.body instanceof FormData)){
        headers["Content-Type"] = "application/json";
    }
    if (token){
        headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(url, {
        ...options,
        headers
    });
    const data = await response.json();
    if (!response.ok){
        throw new Error(data.error || "Something went wrong.");
    
    }
    return data;
}
document.addEventListener("DOMContentLoaded", updateNav);


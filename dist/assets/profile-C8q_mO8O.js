import{a as i,u as w,p as $,f as I}from"./auth-BhX70d5T.js";/* empty css             *//* empty css             */import{N as T}from"./NotificationDropdown-D-Ae2lJf.js";const b=document.createElement("link");b.rel="stylesheet";b.href="/src/styles/notification.css";document.head.appendChild(b);const S=new URLSearchParams(window.location.search),m=S.get("user"),P=S.get("edit")==="1",f=document.getElementById("userBadge"),B=document.getElementById("profileAvatar"),v=document.getElementById("profileName"),U=document.getElementById("profileUsername"),h=document.getElementById("profileBio"),p=document.getElementById("profileLocation"),A=document.getElementById("profileJoined");document.getElementById("repoGrid");const l=document.getElementById("followBtn"),N=document.getElementById("githubLink");document.addEventListener("DOMContentLoaded",()=>{R(),q(),D(),P&&x()});function R(){i.subscribe(L),L(i.getUser())}function L(e){e?H(e):M()}function H(e){const t=document.getElementById("userBadge");if(!t)return;t.innerHTML=`
    <button class="user-badge__trigger" id="userBadgeTrigger">
      <img src="${e.avatar}" alt="${e.name}" class="user-badge__avatar">
      <span class="user-badge__name">${e.username}</span>
    </button>
    <div class="user-badge__dropdown">
      <div class="user-badge__dropdown-header">
        <div class="user-badge__dropdown-name">${e.name}</div>
        <div class="user-badge__dropdown-username">@${e.username}</div>
      </div>
      <ul class="user-badge__dropdown-menu">
        <li><a href="/pillars/community/profile.html" class="user-badge__dropdown-item">👤 Profile</a></li>
        <li><a href="/pillars/community/" class="user-badge__dropdown-item">🌐 Community</a></li>
        
        <!-- Notification Container -->
        <li id="notificationContainer"></li>
        
        <li class="user-badge__dropdown-divider"></li>
        <li><button class="user-badge__dropdown-item" id="logoutBtn">Sign Out</button></li>
      </ul>
    </div>
  `;const a=t.querySelector("#notificationContainer");a&&new T(a);const s=document.getElementById("userBadgeTrigger");s&&s.addEventListener("click",o=>{o.stopPropagation(),f.classList.toggle("user-badge--open")}),document.addEventListener("click",()=>f.classList.remove("user-badge--open"));const n=document.getElementById("logoutBtn");n&&n.addEventListener("click",o=>{o.stopPropagation(),i.logout(),window.location.href="/"})}function M(){f.innerHTML=`
    <button class="user-badge__login" id="navLoginBtn">
      <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sign In
    </button>
  `,document.getElementById("navLoginBtn").addEventListener("click",()=>i.login())}async function q(){var s;const e=i.getUser();let t=null,a=!1;document.querySelector(".profile-content").style.opacity="0.5";try{if(m){console.log("Loading profile for:",m);const o=i.getAccessToken();t=await w.get(m,o),a=e&&e.username===m}else if(e){console.log("Loading own profile");const o=i.getAccessToken();t=await w.get(e.username,o)||e,a=!0}if(!t){document.querySelector(".profile-header").innerHTML=`
        <div class="profile-header__inner" style="text-align: center;">
          <p class="text-dim">User @${m||"unknown"} not found</p>
          <a href="/pillars/community/" class="btn" style="margin-top: var(--sp-3);">Back to Feed</a>
        </div>
      `,document.querySelector(".profile-content").innerHTML="";return}document.title=`${t.name} — OpenWorld`,B.src=t.avatar,B.alt=t.name,v.textContent=t.name,U.textContent=`@${t.username}`,h.textContent=t.bio||"Two-bit hacker from the Sprawl.",t.location?(p.querySelector("span").textContent=t.location,p.style.display="flex"):p.style.display="none",A.textContent=new Date(t.joinedAt||Date.now()).toLocaleDateString("en-US",{month:"short",year:"numeric"}),document.getElementById("statFollowers").textContent=(t.followers||0).toLocaleString(),document.getElementById("statFollowing").textContent=(t.following||0).toLocaleString();let n=t.repos||[];if(a&&i.getAccessToken(),document.getElementById("statRepos").textContent=n.length,N.href=`https://github.com/${t.username}`,a)l.textContent="Edit Profile",l.onclick=()=>{x()};else{const o=i.getUser(),c=(s=o==null?void 0:o.followingList)==null?void 0:s.includes(t.username);E(c),l.onclick=async()=>{if(!i.isLoggedIn()){i.login();return}const d=l.classList.contains("btn--outline")?"follow":"unfollow",u=l.textContent==="Following"?"unfollow":"follow";l.disabled=!0;try{await i.followUser(t.username,u),E(u==="follow");const g=document.getElementById("statFollowers");let _=parseInt(g.textContent.replace(/,/g,""))||0;g.textContent=(u==="follow"?_+1:_-1).toLocaleString()}catch{alert("Failed to update follow status")}finally{l.disabled=!1}}}F(n),await $.loadPosts(),J(t.id||t.username),O()}catch(n){console.error("Error loading profile:",n),document.querySelector(".profile-content").innerHTML=`<p class="error">Failed to load profile: ${n.message}</p>`}finally{document.querySelector(".profile-content").style.opacity="1"}}function E(e){const t=document.getElementById("followBtn");e?(t.textContent="Following",t.classList.add("btn--outline"),t.classList.remove("btn--primary")):(t.textContent="Follow",t.classList.add("btn--primary"),t.classList.remove("btn--outline"))}function O(){const e=document.getElementById("activityTimeline");e.innerHTML=`
    <div class="activity-item">
      <div class="activity-item__time">Now</div>
      <div class="activity-item__content">Viewing profile</div>
    </div>
  `}function F(e){const t=i.getUser(),a=(t==null?void 0:t.pinnedRepos)||[],s=e.filter(r=>a.includes(r.id||r.name)),n=e.filter(r=>!a.includes(r.id||r.name)),o=document.getElementById("pinnedReposContainer"),c=document.getElementById("pinnedRepoGrid"),d=document.getElementById("repoGrid");if(s.length>0?(o.style.display="block",c.innerHTML=s.map(r=>y(r,!0)).join("")):o.style.display="none",n.length===0&&s.length===0){d.innerHTML='<p class="text-dim">No public repositories</p>';return}d.innerHTML=n.map(r=>y(r,!1)).join(""),C()}function y(e,t){var o,c,d,r;const a=((o=e.language)==null?void 0:o.toLowerCase().replace(/[^a-z]/g,""))||"unknown",s=((c=i.getUser())==null?void 0:c.username)===(((d=e.owner)==null?void 0:d.login)||e.owner),n=(((r=i.getUser())==null?void 0:r.starredRepos)||[]).some(u=>u.id===e.id||u.name===e.name);return`
    <div class="repo-card">
      <a href="${e.url}" class="repo-card__link" target="_blank" rel="noopener">
        <div class="repo-card__header">
          <span class="repo-card__icon">📦</span>
          <span class="repo-card__name">${e.name}</span>
        </div>
        <p class="repo-card__desc">${e.description||"No description"}</p>
      </a>
      <div class="repo-card__footer">
        <span class="repo-card__lang">
          <span class="repo-card__lang-dot repo-card__lang-dot--${a}"></span>
          ${e.language||"Unknown"}
        </span>
        <div class="repo-card__actions">
           <span>⭐ ${(e.stars||0).toLocaleString()}</span>
           
           <button class="btn btn--icon btn--sm ${n?"text-copper":""}" 
             data-action="star" 
             data-repo='${JSON.stringify(e).replace(/'/g,"&#39;")}'
             title="${n?"Unstar":"Star"}">
             ${n?"★":"☆"}
           </button>
           
           ${s?`
             <button class="btn btn--icon btn--sm ${t?"text-copper":""}" 
               data-action="pin" 
               data-repo-id="${e.id||e.name}"
               title="${t?"Unpin":"Pin"}">
               ${t?"📌":"📍"}
             </button>
           `:""}
        </div>
      </div>
    </div>
  `}function C(){document.querySelectorAll('[data-action="pin"]').forEach(e=>{e.onclick=t=>{t.stopPropagation(),j(e.dataset.repoId)}}),document.querySelectorAll('[data-action="star"]').forEach(e=>{e.onclick=t=>{t.stopPropagation();const a=JSON.parse(e.dataset.repo.replace(/&#39;/g,"'"));G(a)}})}function j(e){const t=i.getUser();if(!t)return;let a=t.pinnedRepos||[];a.includes(Number(e))||a.includes(String(e))?a=a.filter(s=>String(s)!==String(e)):a.push(e),t.pinnedRepos=a,i.updateProfile({pinnedRepos:a}),window.location.reload()}function G(e){const t=i.getUser();if(!t)return;let a=t.starredRepos||[];const s=a.find(o=>o.id===e.id||o.name===e.name);s?a=a.filter(o=>o.id!==e.id&&o.name!==e.name):(a.push({id:e.id,name:e.name,owner:e.owner,description:e.description,language:e.language,stars:e.stars,url:e.url}),fetch("/.netlify/functions/track-trending",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t.accessToken}`},body:JSON.stringify({repo:{id:e.id,name:e.name,description:e.description,url:e.url},action:"star"})}).catch(o=>console.warn("Trending signal failed",o))),s&&fetch("/.netlify/functions/track-trending",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t.accessToken}`},body:JSON.stringify({repo:{id:e.id,name:e.name},action:"unstar"})}).catch(o=>console.warn("Trending signal failed",o)),i.updateProfile({starredRepos:a}),document.querySelectorAll('[data-action="star"]').forEach(o=>{o.dataset.repo.includes(e.name)&&(o.innerHTML=s?"☆":"★",o.classList.toggle("text-copper"))}),document.querySelector('[data-tab="starred"].profile-tab--active')&&k()}function k(){const e=i.getUser(),t=(e==null?void 0:e.starredRepos)||[],a=document.getElementById("starredRepoGrid");if(t.length===0){a.innerHTML='<p class="text-dim">No starred repositories</p>';return}a.innerHTML=t.map(s=>y(s,!1)).join(""),C()}function J(e){const a=$.getPosts().filter(n=>n.userId===e||n.username===e),s=document.getElementById("userPosts");if(a.length===0){s.innerHTML='<p class="text-dim" style="text-align: center; padding: var(--sp-6);">No posts yet.</p>';return}s.innerHTML=a.map(n=>{var o;return`
    <div class="post-card">
      <div class="post-card__header">
        <a href="/pillars/community/profile.html?user=${n.username}" class="post-card__avatar-link">
          <img src="${n.userAvatar||"https://github.com/identicons/"+n.username+".png"}" class="post-card__avatar" alt="${n.username}">
        </a>
        <div class="post-card__meta">
          <a href="/pillars/community/profile.html?user=${n.username}" class="post-card__name">${escapeHtml(n.userName||n.username)}</a>
          <a href="/pillars/community/profile.html?user=${n.username}" class="post-card__username">@${escapeHtml(n.username)}</a>
          <span class="post-card__time">${I(n.createdAt)}</span>
        </div>
      </div>
      <div class="post-card__content">${escapeHtml(n.content||"")}</div>
      ${n.code?`
        <div class="code-block" data-language="${n.code.language}">
          <div class="code-block__header">
            <span class="code-block__language">${n.code.language}</span>
          </div>
          <pre class="code-block__body"><code>${escapeHtml(n.code.code)}</code></pre>
        </div>
      `:""}
      ${n.repo?`
        <a href="${n.repo.url}" class="selected-repo" target="_blank" style="margin-top: var(--sp-2);">
          <span>📦 ${escapeHtml(n.repo.name)}</span>
          ${n.repo.stars?`<span>⭐ ${n.repo.stars}</span>`:""}
        </a>
      `:""}
      <div class="post-card__actions">
         <span class="text-dim">🔥 ${((o=n.reactions)==null?void 0:o.fire)||0}</span>
      </div>
    </div>
  `}).join("")}function x(){if(!i.getUser())return;const t=document.createElement("style");t.textContent=`
    .editable {
      border: 1px dashed var(--copper-500) !important;
      padding: var(--sp-1) var(--sp-2) !important;
      border-radius: var(--radius);
      cursor: text;
      background: rgba(255,255,255,0.05);
    }
    .editable:focus {
      outline: none;
      background: var(--surface);
      border-style: solid !important;
    }
    .edit-actions {
      display: flex;
      gap: var(--sp-2);
      margin-top: var(--sp-3);
    }
  `,document.head.appendChild(t),[v,h,p?p.querySelector("span"):null].forEach(o=>{o&&(o.contentEditable=!0,o.classList.add("editable"))}),l.textContent="Save Changes",l.classList.add("btn--primary");const s=l.cloneNode(!0);l.parentNode.replaceChild(s,l),s.onclick=z;const n=document.createElement("button");n.className="btn",n.textContent="Cancel",n.onclick=()=>window.location.href="/pillars/community/profile.html",s.parentNode.appendChild(n)}function z(){const e=v.textContent.trim(),t=h.textContent.trim();i.updateProfile({name:e,bio:t}),window.location.href="/pillars/community/profile.html"}function D(){const e=document.querySelectorAll(".profile-tab"),t={repos:document.getElementById("reposSection"),starred:document.getElementById("starredSection"),activity:document.getElementById("activitySection"),posts:document.getElementById("postsSection")};e.forEach(a=>{a.addEventListener("click",()=>{e.forEach(n=>n.classList.remove("profile-tab--active")),a.classList.add("profile-tab--active");const s=a.dataset.tab;Object.entries(t).forEach(([n,o])=>{o&&(o.style.display=n===s?"block":"none")}),s==="starred"&&k()})})}console.log("%c◈ OpenWorld Profile","color: #b87333; font-size: 16px;");

import{a as c,u as C,p as g,f as A}from"./auth-qTptiIUO.js";/* empty css             */import{r as R,C as M}from"./PostCard-C_V0m3eT.js";/* empty css                       */import{N}from"./NotificationDropdown-BsIzgKD3.js";const w=document.createElement("link");w.rel="stylesheet";w.href="/src/styles/notification.css";document.head.appendChild(w);const k=new URLSearchParams(window.location.search),f=k.get("user"),q=k.get("edit")==="1",b=document.getElementById("userBadge"),L=document.getElementById("profileAvatar"),E=document.getElementById("profileName"),F=document.getElementById("profileUsername"),B=document.getElementById("profileBio"),v=document.getElementById("profileLocation"),H=document.getElementById("profileJoined");document.getElementById("repoGrid");const u=document.getElementById("followBtn"),O=document.getElementById("githubLink");document.addEventListener("DOMContentLoaded",()=>{j(),G(),Z(),q&&U()});function j(){c.subscribe(x),x(c.getUser())}function x(e){e?z(e):D()}function z(e){const t=document.getElementById("userBadge");if(!t)return;t.innerHTML=`
    <button class="user-badge__trigger" id="userBadgeTrigger">
      <img src="${e.avatar}" alt="${e.name}" class="user-badge__avatar">
      <span class="user-badge__name">${e.username}</span>
      <span class="notification-badge-external" id="externalNotifBadge" style="display: none">0</span>
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
  `;const n=t.querySelector("#notificationContainer");n&&new N(n);const o=document.getElementById("userBadgeTrigger");o&&o.addEventListener("click",s=>{s.stopPropagation(),b.classList.toggle("user-badge--open")}),document.addEventListener("click",()=>b.classList.remove("user-badge--open"));const a=document.getElementById("logoutBtn");a&&a.addEventListener("click",s=>{s.stopPropagation(),c.logout(),window.location.href="/"})}function D(){b.innerHTML=`
    <button class="user-badge__login" id="navLoginBtn">
      <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sign In
    </button>
  `,document.getElementById("navLoginBtn").addEventListener("click",()=>c.login())}async function G(){var o;const e=c.getUser();let t=null,n=!1;document.querySelector(".profile-content").style.opacity="0.5";try{if(f){console.log("Loading profile for:",f);const l=c.getAccessToken();t=await C.get(f,l),n=e&&e.username===f}else if(e){console.log("Loading own profile");const l=c.getAccessToken();t=await C.get(e.username,l)||e,n=!0}if(!t){document.querySelector(".profile-header").innerHTML=`
        <div class="profile-header__inner" style="text-align: center;">
          <p class="text-dim">User @${f||"unknown"} not found</p>
          <a href="/pillars/community/" class="btn" style="margin-top: var(--sp-3);">Back to Feed</a>
        </div>
      `,document.querySelector(".profile-content").innerHTML="";return}document.title=`${t.name} — OpenWorld`,L.src=t.avatar,L.alt=t.name,E.textContent=t.name,F.textContent=`@${t.username}`,B.textContent=t.bio||"Two-bit hacker from the Sprawl.",t.location?(v.querySelector("span").textContent=t.location,v.style.display="flex"):v.style.display="none",H.textContent=new Date(t.joinedAt||Date.now()).toLocaleDateString("en-US",{month:"short",year:"numeric"}),document.getElementById("statFollowers").textContent=(t.followers||0).toLocaleString(),document.getElementById("statFollowing").textContent=(t.following||0).toLocaleString();let a=t.repos||[];if(n&&c.getAccessToken(),document.getElementById("statRepos").textContent=a.length,O.href=`https://github.com/${t.username}`,n)u.textContent="Edit Profile",u.onclick=()=>{U()};else{const l=c.getUser(),r=(o=l==null?void 0:l.followingList)==null?void 0:o.includes(t.username);S(r),u.onclick=async()=>{if(!c.isLoggedIn()){c.login();return}const d=u.classList.contains("btn--outline")?"follow":"unfollow",m=u.textContent==="Following"?"unfollow":"follow";u.disabled=!0;try{await c.followUser(t.username,m),S(m==="follow");const y=document.getElementById("statFollowers");let _=parseInt(y.textContent.replace(/,/g,""))||0;y.textContent=(m==="follow"?_+1:_-1).toLocaleString()}catch{alert("Failed to update follow status")}finally{u.disabled=!1}}}V(a),await g.loadPosts(),I(t.username||t.id);const s=g.getPostsByUser(t.username||t.id).length,i=document.getElementById("statPosts");i&&(i.textContent=s),J(t)}catch(a){console.error("Error loading profile:",a),document.querySelector(".profile-content").innerHTML=`<p class="error">Failed to load profile: ${a.message}</p>`}finally{document.querySelector(".profile-content").style.opacity="1"}}function S(e){const t=document.getElementById("followBtn");e?(t.textContent="Following",t.classList.add("btn--outline"),t.classList.remove("btn--primary")):(t.textContent="Follow",t.classList.add("btn--primary"),t.classList.remove("btn--outline"))}async function J(e){var n;const t=document.getElementById("activityTimeline");t.innerHTML='<p class="text-dim" style="padding: var(--sp-4); text-align: center;">Loading activity...</p>';try{const o=e?e.username:f||((n=c.getUser())==null?void 0:n.username);if(!o)return;const a=await fetch(`https://api.github.com/users/${o}/events`);if(!a.ok)throw new Error("Failed to fetch events");const s=await a.json(),i=Date.now()-168*3600*1e3,r=s.filter(p=>new Date(p.created_at).getTime()>i)||[];$(r);const d=document.getElementById("activityFilter");d&&(d.onchange=()=>{const p=d.value,m=p==="all"?r:r.filter(y=>y.type===p);$(m)})}catch(o){console.error("Activity load error:",o),t.innerHTML='<p class="text-dim" style="padding: var(--sp-4); text-align: center;">No recent activity found.</p>'}}function $(e){const t=document.getElementById("activityTimeline");if(!e||e.length===0){t.innerHTML='<p class="text-dim" style="padding: var(--sp-4); text-align: center;">No activity in the last 7 days.</p>';return}t.innerHTML=e.map(n=>`
      <div class="activity-item">
         <div class="activity-item__time">${A(n.created_at)}</div>
         <div class="activity-item__content">
            ${W(n)}
         </div>
      </div>
   `).join("")}function W(e){const t=e.repo.name,n=`<a href="https://github.com/${t}" target="_blank" class="link">${t}</a>`;switch(e.type){case"PushEvent":const o=e.payload.size;return`Pushed ${o} commit${o===1?"":"s"} to ${n}`;case"WatchEvent":return`Starred ${n}`;case"CreateEvent":return`Created ${e.payload.ref_type||"repository"} ${n}`;case"ForkEvent":return`Forked ${n}`;case"IssuesEvent":return`${e.payload.action} issue in ${n}`;case"PullRequestEvent":return`${e.payload.action} PR in ${n}`;case"MemberEvent":return`Added member to ${n}`;case"PublicEvent":return`Made ${n} public`;default:return`Activity in ${n}`}}function V(e){const t=c.getUser(),n=(t==null?void 0:t.pinnedRepos)||[],o=e.filter(r=>n.includes(r.id||r.name)),a=e.filter(r=>!n.includes(r.id||r.name)),s=document.getElementById("pinnedReposContainer"),i=document.getElementById("pinnedRepoGrid"),l=document.getElementById("repoGrid");if(o.length>0?(s.style.display="block",i.innerHTML=o.map(r=>h(r,!0)).join("")):s.style.display="none",a.length===0&&o.length===0){l.innerHTML='<p class="text-dim">No public repositories</p>';return}l.innerHTML=a.map(r=>h(r,!1)).join(""),P()}function h(e,t){var s,i,l,r;const n=((s=e.language)==null?void 0:s.toLowerCase().replace(/[^a-z]/g,""))||"unknown",o=((i=c.getUser())==null?void 0:i.username)===(((l=e.owner)==null?void 0:l.login)||e.owner),a=(((r=c.getUser())==null?void 0:r.starredRepos)||[]).some(d=>d.id===e.id||d.name===e.name);return`
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
          <span class="repo-card__lang-dot repo-card__lang-dot--${n}"></span>
          ${e.language||"Unknown"}
        </span>
        <div class="repo-card__actions">
           <span>⭐ ${(e.stars||0).toLocaleString()}</span>
           
           <button class="btn btn--icon btn--sm ${a?"text-copper":""}" 
             data-action="star" 
             data-repo='${JSON.stringify(e).replace(/'/g,"&#39;")}'
             title="${a?"Unstar":"Star"}">
             ${a?"★":"☆"}
           </button>
           
           ${o?`
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
  `}function P(){document.querySelectorAll('[data-action="pin"]').forEach(e=>{e.onclick=t=>{t.stopPropagation(),K(e.dataset.repoId)}}),document.querySelectorAll('[data-action="star"]').forEach(e=>{e.onclick=t=>{t.stopPropagation();const n=JSON.parse(e.dataset.repo.replace(/&#39;/g,"'"));Q(n)}})}function K(e){const t=c.getUser();if(!t)return;let n=t.pinnedRepos||[];n.includes(Number(e))||n.includes(String(e))?n=n.filter(o=>String(o)!==String(e)):n.push(e),t.pinnedRepos=n,c.updateProfile({pinnedRepos:n}),window.location.reload()}function Q(e){const t=c.getUser();if(!t)return;let n=t.starredRepos||[];const o=n.find(s=>s.id===e.id||s.name===e.name);o?n=n.filter(s=>s.id!==e.id&&s.name!==e.name):(n.push({id:e.id,name:e.name,owner:e.owner,description:e.description,language:e.language,stars:e.stars,url:e.url}),fetch("/.netlify/functions/track-trending",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t.accessToken}`},body:JSON.stringify({repo:{id:e.id,name:e.name,description:e.description,url:e.url},action:"star"})}).catch(s=>console.warn("Trending signal failed",s))),o&&fetch("/.netlify/functions/track-trending",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t.accessToken}`},body:JSON.stringify({repo:{id:e.id,name:e.name},action:"unstar"})}).catch(s=>console.warn("Trending signal failed",s)),c.updateProfile({starredRepos:n}),document.querySelectorAll('[data-action="star"]').forEach(s=>{s.dataset.repo.includes(e.name)&&(s.innerHTML=o?"☆":"★",s.classList.toggle("text-copper"))}),document.querySelector('[data-tab="starred"].profile-tab--active')&&T()}function T(){const e=c.getUser(),t=(e==null?void 0:e.starredRepos)||[],n=document.getElementById("starredRepoGrid");if(t.length===0){n.innerHTML='<p class="text-dim">No starred repositories</p>';return}n.innerHTML=t.map(o=>h(o,!1)).join(""),P()}function I(e){const n=g.getPosts().filter(a=>a.userId===e||a.username===e),o=document.getElementById("userPosts");if(n.length===0){o.innerHTML='<p class="text-dim" style="text-align: center; padding: var(--sp-6);">No posts yet.</p>';return}o.innerHTML=n.map(a=>R(a)).join(""),o.dataset.eventsBound||(o.addEventListener("click",a=>X(a,e)),o.dataset.eventsBound="true")}async function X(e,t){const n=e.target.closest(".code-block__copy");if(n){const i=decodeURIComponent(n.dataset.code);navigator.clipboard.writeText(i).then(()=>{n.textContent="✓",setTimeout(()=>n.textContent="📋",1500)});return}const o=e.target.closest(".post-card__action");if(!o)return;const a=o.dataset.action,s=o.dataset.postId;if(a==="react"&&s){const i=await g.reactToPost(s,"fire");if(i){const l=o.querySelector("span"),r=Object.values(i.reactions||{fire:0}).reduce((d,p)=>d+p,0);l.textContent=r,i.hasReacted?o.classList.add("post-card__action--active"):o.classList.remove("post-card__action--active")}}if(a==="delete"&&s&&confirm("Delete this post?")){await g.deletePost(s),I(t);const i=document.getElementById("statPosts");i&&(i.textContent=g.getPostsByUser(t).length)}if(a==="comment"&&s){const i=document.getElementById(`comments-${s}`);if(!i)return;const l=i.style.display!=="none";if(i.style.display=l?"none":"block",!l&&!i.dataset.initialized){const r=g.getPosts().find(d=>d.id===s);r&&(new M(i,r,{onCommentAdded:d=>{const p=document.querySelector(`[data-action="comment"][data-post-id="${s}"] span`);if(p){const m=parseInt(p.textContent)||0;p.textContent=m+1}}}),i.dataset.initialized="true")}}}function U(){if(!c.getUser())return;const t=document.createElement("style");t.textContent=`
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
  `,document.head.appendChild(t),[E,B,v?v.querySelector("span"):null].forEach(s=>{s&&(s.contentEditable=!0,s.classList.add("editable"))}),u.textContent="Save Changes",u.classList.add("btn--primary");const o=u.cloneNode(!0);u.parentNode.replaceChild(o,u),o.onclick=Y;const a=document.createElement("button");a.className="btn",a.textContent="Cancel",a.onclick=()=>window.location.href="/pillars/community/profile.html",o.parentNode.appendChild(a)}function Y(){const e=E.textContent.trim(),t=B.textContent.trim();c.updateProfile({name:e,bio:t}),window.location.href="/pillars/community/profile.html"}function Z(){const e=document.querySelectorAll(".profile-tab"),t={repos:document.getElementById("reposSection"),starred:document.getElementById("starredSection"),activity:document.getElementById("activitySection"),posts:document.getElementById("postsSection")};e.forEach(n=>{n.addEventListener("click",()=>{e.forEach(a=>a.classList.remove("profile-tab--active")),n.classList.add("profile-tab--active");const o=n.dataset.tab;Object.entries(t).forEach(([a,s])=>{s&&(s.style.display=a===o?"block":"none")}),o==="starred"&&T()})})}console.log("%c◈ OpenWorld Profile","color: #b87333; font-size: 16px;");

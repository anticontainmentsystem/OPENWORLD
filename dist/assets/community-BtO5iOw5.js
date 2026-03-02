import{a as g,u as z,f as D,b as W,p as u}from"./auth-BoBc4x_h.js";/* empty css             */import{G as O,r as J,C as q,a as Y,e as G,b as K}from"./ConfirmModal-DuGGNfyR.js";/* empty css                       */import{i as Q}from"./CursorTrail-19OP0d5w.js";import{N as X}from"./NotificationDropdown-Cul7GRCK.js";class Z{constructor(e,n={}){this.container=e,this.onSelect=n.onSelect||(()=>{}),this.onClose=n.onClose||(()=>{}),this.mode="all",this.events=[],this.loading=!1,this.init()}async init(){this.render(),this.loadEvents()}async loadEvents(){this.loading=!0,this.renderContent();try{const e=g.getUser();if(!e)throw new Error("Not logged in");this.events=await z.getEvents(e.username,e.accessToken)}catch(e){console.error("Failed to load events:",e),this.events=[]}finally{this.loading=!1,this.renderContent()}}render(){this.container.innerHTML=`
      <div class="gh-browser" style="position: relative; top: auto; left: auto; right: auto; width: 600px; max-width: 90%; margin: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <header class="gh-browser__header">
          <div class="gh-browser__title">
            <span>Select Activity</span>
          </div>
          <div class="gh-browser__actions">
             <div class="gh-browser__tabs">
               <button class="gh-browser__tab gh-browser__tab--active" data-tab="all">All</button>
               <button class="gh-browser__tab" data-tab="PushEvent">Commits</button>
               <button class="gh-browser__tab" data-tab="IssuesEvent">Issues</button>
               <button class="gh-browser__tab" data-tab="PullRequestEvent">PRs</button>
             </div>
             <button class="gh-browser__close">×</button>
          </div>
        </header>

        <div class="gh-browser__content">
          <!-- Content goes here -->
        </div>
      </div>
    `,this.bindEvents()}renderContent(){const e=this.container.querySelector(".gh-browser__content");if(!e)return;if(this.loading){e.innerHTML='<div class="gh-browser__loading">Loading activity...</div>';return}if(this.events.length===0){e.innerHTML='<div class="gh-browser__empty">No recent activity found.</div>';return}const n=this.mode==="all"?this.events.filter(o=>["PushEvent","IssuesEvent","PullRequestEvent"].includes(o.type)):this.events.filter(o=>o.type===this.mode);if(n.length===0){e.innerHTML='<div class="gh-browser__empty">No matching activity found.</div>';return}e.innerHTML=n.map(o=>this.renderEventItem(o)).join(""),this.bindContentEvents()}renderEventItem(e){var d;let n="📝",o="Activity",s="",i="Select",a=null;if(e.type==="PushEvent"){n="📝",o=`Pushed to ${e.repo.name}`;const r=e.payload.commits||[],c=r.length;s=`${c} commit${c===1?"":"s"}: ${((d=r[0])==null?void 0:d.message)||"No message"}`,a={type:"commit",repo:e.repo,commit:r[0]||{},head:e.payload.head}}else e.type==="IssuesEvent"?(n="🐛",o=`${e.payload.action} issue in ${e.repo.name}`,s=`#${e.payload.issue.number}: ${e.payload.issue.title}`,a={type:"issue",repo:e.repo,issue:e.payload.issue}):e.type==="PullRequestEvent"&&(n="🔀",o=`${e.payload.action} PR in ${e.repo.name}`,s=`#${e.payload.pull_request.number}: ${e.payload.pull_request.title}`,a={type:"pr",repo:e.repo,pr:e.payload.pull_request});return`
      <div class="gh-item" data-payload='${JSON.stringify(a).replace(/'/g,"&#39;")}'>
        <div class="gh-item__icon">${n}</div>
        <div class="gh-item__details">
          <div class="gh-item__name">${o}</div>
          <div class="gh-item__desc">${s}</div>
          <div class="gh-item__meta text-dim text-xs">${D(e.created_at)}</div>
        </div>
        <div class="gh-item__actions">
          <button class="gh-btn gh-btn--sm gh-btn--primary" data-action="select">${i}</button>
        </div>
      </div>
    `}bindEvents(){const e=this.container.querySelector(".gh-browser");e.querySelector(".gh-browser__close").addEventListener("click",()=>this.onClose());const n=e.querySelectorAll(".gh-browser__tab");n.forEach(o=>{o.addEventListener("click",s=>{n.forEach(i=>i.classList.remove("gh-browser__tab--active")),s.target.classList.add("gh-browser__tab--active"),this.mode=s.target.dataset.tab,this.renderContent()})})}bindContentEvents(){this.container.querySelectorAll('.gh-btn[data-action="select"]').forEach(e=>{e.addEventListener("click",n=>{const o=n.target.closest(".gh-item");try{const s=JSON.parse(o.dataset.payload.replace(/&#39;/g,"'"));this.onSelect(s)}catch(s){console.error("Selection error",s)}})})}}class ee{constructor(e,n={}){this.container=e,this.onSelect=n.onSelect||(()=>{}),this.onClose=n.onClose||(()=>{}),this.userRepos=[],this.render()}async render(){this.container.innerHTML=`
      <div class="media-picker-modal">
        <div class="media-picker-content">
          <header class="media-picker-header">
            <h3>Add Media</h3>
            <button class="media-picker-close">×</button>
          </header>
          
          <div class="media-picker-tabs">
            <button class="media-tab media-tab--active" data-tab="url">🔗 Link</button>
            <button class="media-tab" data-tab="repos">📦 My Repos</button>
            <button class="media-tab" data-tab="search">🔍 Search</button>
          </div>
          
          <div class="media-picker-body">
            <!-- URL Tab -->
            <div id="media-tab-url" class="media-tab-content" style="display: block;">
              <div class="form-group">
                <label>Media URL (Image, Video, GIF)</label>
                <input type="text" id="mediaUrlInput" placeholder="https://..." class="form-input">
              </div>
              <div class="form-group">
                <label>Type</label>
                <select id="mediaTypeInput" class="form-select">
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="gif">GIF</option>
                </select>
              </div>
              <div id="mediaPreview" class="media-preview-box">
                <span class="text-dim">Preview will appear here...</span>
              </div>
              <button class="btn btn--primary" id="addMediaUrlBtn" disabled>Add Media</button>
            </div>

            <!-- Repos Tab -->
            <div id="media-tab-repos" class="media-tab-content" style="display: none;">
              <div id="repoBrowserMount">Loading...</div>
            </div>

            <!-- Search Tab -->
            <div id="media-tab-search" class="media-tab-content" style="display: none;">
              <div class="text-center text-dim" style="padding: 20px;">
                Use the search tab in the browser to find repositories with media.
              </div>
              <!-- Re-use repo browser mount but switch mode? or separate mount? -->
              <!-- For simplicity, let's just use one browser instance and switch its tabs/mode -->
            </div>
          </div>
        </div>
      </div>
    `,this.bindEvents()}bindEvents(){const e=this.container.querySelector(".media-picker-close");e.onclick=()=>this.onClose();const n=this.container.querySelectorAll(".media-tab");n.forEach(r=>{r.onclick=()=>{n.forEach(b=>b.classList.remove("media-tab--active")),r.classList.add("media-tab--active");const c=r.dataset.tab;this.switchTab(c)}});const o=this.container.querySelector("#mediaUrlInput"),s=this.container.querySelector("#mediaTypeInput"),i=this.container.querySelector("#mediaPreview"),a=this.container.querySelector("#addMediaUrlBtn"),d=()=>{const r=o.value.trim();if(!r){a.disabled=!0,i.innerHTML='<span class="text-dim">Preview will appear here...</span>';return}const c=s.value;a.disabled=!1,c==="image"||c==="gif"?i.innerHTML=`<img src="${r}" style="max-width: 100%; max-height: 200px; border-radius: 4px;">`:c==="video"&&(i.innerHTML=`<video src="${r}" controls style="max-width: 100%; max-height: 200px; border-radius: 4px;"></video>`),r.match(/\.(mp4|webm|mov)$/i)?s.value="video":r.match(/\.(gif)$/i)?s.value="gif":r.match(/\.(jpg|jpeg|png|webp|svg)$/i)&&(s.value="image")};o.oninput=d,s.onchange=d,a.onclick=()=>{this.onSelect({type:s.value,url:o.value.trim()})}}async switchTab(e){if(this.container.querySelectorAll(".media-tab-content").forEach(n=>n.style.display="none"),this.container.querySelector(`#media-tab-${e==="search"?"repos":e}`).style.display="block",e==="repos"||e==="search"){const n=this.container.querySelector("#repoBrowserMount");n.innerHTML="",this.userRepos.length===0&&(this.userRepos=await W()),new O({container:n,userRepos:this.userRepos,onSelect:o=>this.handleRepoSelection(o),onClose:()=>{},fileFilter:o=>/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i.test(o.name)})}}handleRepoSelection(e){if(e.type==="file"){const n=e.data,o=e.repo,s=n.download_url,i=/\.(mp4|webm|mov)$/i.test(n.name)?"video":/\.(gif)$/i.test(n.name)?"gif":"image";this.onSelect({type:i,url:s,repoRef:{owner:o.owner.login||o.owner,repo:o.name,path:n.path}})}}}const F={engagement:t=>(t.postCount||0)*2+(t.fireCount||0)*3,community:t=>(t.postCount||0)*1+(t.followingCount||0)*2},T={getRecommendations(t,e,n={}){const{tier1Count:o=3,tier2Count:s=3,excludeFollowed:i=!0}=n;let a=t.filter(m=>e?m.username!==e.username:!0);if(i&&(e!=null&&e.following)&&Array.isArray(e.following)){const m=new Set(e.following.map(y=>y.username||y));a=a.filter(y=>!m.has(y.username))}const d=[...a].map(m=>({...m,score:F.engagement(m)})).sort((m,y)=>y.score-m.score).slice(0,o),r=new Set(d.map(m=>m.username)),b=[...a.filter(m=>!r.has(m.username))].map(m=>({...m,score:F.community(m)})).sort((m,y)=>y.score-m.score).slice(0,s);return[...d,...b]},calculateUserStats(t){const e={};return t.forEach(n=>{var s;if(n.deleted)return;const o=n.username;o&&(e[o]||(e[o]={username:o,userId:n.userId,username:o,userId:n.userId,avatar:n.avatar||`https://github.com/${o}.png`,postCount:0,fireCount:0,followingCount:0}),e[o].postCount++,e[o].fireCount+=((s=n.reactions)==null?void 0:s.fire)||0)}),e},getMemberCount(t){const e=new Set;return t.forEach(n=>{n.username&&e.add(n.username)}),e.size}};Q();const R=document.createElement("link");R.rel="stylesheet";R.href="/src/styles/modal.css";document.head.appendChild(R);const A=document.createElement("link");A.rel="stylesheet";A.href="/src/styles/comment.css";document.head.appendChild(A);console.log(`%c
 _   _      _ _         ___                __        __         _     _ _ 
| | | | ___| | | ___   / _ \\ _ __   ___ _ _\\ \\      / /__  _ __| | __| | |
| |_| |/ _ \\ | |/ _ \\ | | | | '_ \\ / _ \\ '_ \\ \\ /\\ / / _ \\| '__| |/ _\` | |
|  _  |  __/ | | (_) || |_| | |_) |  __/ | | \\ V  V / (_) | |  | | (_| |_|
|_| |_|\\___|_|_|\\___/  \\___/| .__/ \\___|_| |_|\\_/\\_/ \\___/|_|  |_|\\__,_(_)
                            |_|
`,"color: #b87333; font-family: monospace;");const I=document.getElementById("userBadge"),_=document.getElementById("composer"),H=document.getElementById("loginPrompt"),L=document.getElementById("feedPosts"),U=document.getElementById("suggestions"),N=document.getElementById("userStats");let B=[],h=null,l=null,p=null,w=!1,S=null;function te(t){w=!0,S=t.id;const e=document.getElementById("composerInput");e&&(e.value=t.content||"",e.focus()),h=t.repo,l=t.code,p=t.activity,v=t.media,E(),C(),k(),P();const n=document.getElementById("postBtn");n&&(n.textContent="Save Changes",n.classList.add("btn--moss"));let o=document.getElementById("cancelEditBtn");o||(o=document.createElement("button"),o.id="cancelEditBtn",o.className="btn btn--text",o.textContent="Cancel",o.style.marginRight="8px",o.addEventListener("click",ne),n.parentNode.insertBefore(o,n)),window.scrollTo({top:0,behavior:"smooth"})}function ne(){w=!1,S=null;const t=document.getElementById("composerInput");t&&(t.value=""),h=null,l=null,p=null,v=null,E(),C(),k(),P();const e=document.getElementById("postBtn");e&&(e.textContent="Post",e.classList.remove("btn--moss"));const n=document.getElementById("cancelEditBtn");n&&n.remove()}let v=null,f=null,j=0;const oe=6e4;document.addEventListener("DOMContentLoaded",async()=>{ie(),await se(),ce(),u.subscribe(()=>{x(g.getUser())}),u.startPolling(4e3)});async function se(){L.innerHTML=`
    <div class="card" style="text-align: center; padding: var(--sp-5);">
      <div style="font-size: 1.5rem; margin-bottom: var(--sp-2);">⏳</div>
      <p class="text-dim">Loading posts...</p>
    </div>
  `,await u.loadPosts(),$(),x(g.getUser())}function ie(){g.subscribe(x),x(g.getUser())}async function x(t){if(t){ae(t),_.style.display="block",H.style.display="none",N.style.display="block",document.getElementById("composerAvatar").src=t.avatar;const e=document.getElementById("statFollowing");e&&(e.textContent=t.following||0);const n=document.getElementById("statFollowers");n&&(n.textContent=t.followers||0);const o=document.getElementById("statPosts");if(o){const a=u.getPostsByUser(t.username||t.id);o.textContent=a.length}const s=document.getElementById("statFires");s&&(s.textContent=u.getFiresReceived());const i=Date.now();if(i-j>oe){j=i;const a=g.getAccessToken();a&&z.get(t.username,a).then(d=>{if(d&&d.followers!==void 0){const r=document.getElementById("statFollowers");r&&(r.textContent=d.followers||0);const c=g.getUser();c&&c.followers!==d.followers&&(c.followers=d.followers,localStorage.setItem("openworld_user",JSON.stringify(c)))}}).catch(d=>console.error("[Feed] Profile refresh error:",d))}B=await W(),B.length===0&&t.repos&&(B=t.repos),M(t)}else de(),_.style.display="none",H.style.display="block",N.style.display="none",M(null)}function ae(t){I.innerHTML=`
    <button class="user-badge__trigger" id="userBadgeTrigger">
      <img src="${t.avatar}" alt="${t.name}" class="user-badge__avatar">
      <span class="user-badge__name">${t.username}</span>
      <span class="notification-badge-external" id="externalNotifBadge" style="display: none">0</span>
    </button>
    <div class="user-badge__dropdown">
      <div class="user-badge__dropdown-header">
        <div class="user-badge__dropdown-name">${t.name}</div>
        <div class="user-badge__dropdown-username">@${t.username}</div>
      </div>
      <ul class="user-badge__dropdown-menu">
        <li><a href="/pillars/community/profile.html" class="user-badge__dropdown-item">👤 Profile</a></li>
        <li><a href="/pillars/community/profile.html?edit=1" class="user-badge__dropdown-item">✏️ Edit Profile</a></li>
        
        <!-- Notification Container -->
        <li id="notificationContainer"></li>
        
        <li class="user-badge__dropdown-divider"></li>
        <li><button class="user-badge__dropdown-item" id="logoutBtn">Sign Out</button></li>
      </ul>
    </div>
  `;const e=document.getElementById("notificationContainer");e&&new X(e),document.getElementById("userBadgeTrigger").addEventListener("click",n=>{n.stopPropagation(),I.classList.toggle("user-badge--open")}),document.addEventListener("click",()=>I.classList.remove("user-badge--open")),document.getElementById("logoutBtn").addEventListener("click",()=>g.logout())}function de(){I.innerHTML=`
    <button class="user-badge__login" id="navLoginBtn">
      <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sign In
    </button>
  `,document.getElementById("navLoginBtn").addEventListener("click",()=>g.login())}function $(){const t=u.getPosts(),e=g.getUser(),n=t.filter(o=>!!(!o.deleted||e&&String(o.userId)===String(e.id)));if(n.length===0){L.innerHTML=`
      <div class="card" style="text-align: center; padding: var(--sp-5);">
        <div style="font-size: 2rem; margin-bottom: var(--sp-2);">🌐</div>
        <h3 style="margin-bottom: var(--sp-1);">No posts yet</h3>
        <p class="text-dim">Be the first to share what you're building.</p>
      </div>
    `;return}L.innerHTML=n.map(o=>J(o)).join("")}function M(t){const e=u.getPosts(),n=T.getMemberCount(e),o=T.calculateUserStats(e),s=Object.values(o),i=T.getRecommendations(s,t);let a=`
    <div style="margin-bottom: var(--sp-3); padding-bottom: var(--sp-2); border-bottom: 1px solid var(--border);">
      <span class="text-dim" style="font-size: 0.8rem;">◈ ${n} OpenWorlders</span>
    </div>
  `;if(i.length===0){a+='<p class="text-dim" style="font-size: 0.85rem;">No recommendations yet.</p>',U.innerHTML=a;return}a+=i.map(d=>`
    <div class="suggestion-item" style="display: flex; align-items: center; gap: var(--sp-2); padding: var(--sp-2) 0;">
      <img src="${d.avatar||`https://github.com/${d.username}.png`}" 
           alt="${d.username}" 
           style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
      <div style="flex: 1; min-width: 0;">
        <a href="/pillars/community/profile.html?user=${d.username}" 
           style="font-size: 0.85rem; font-weight: 500; color: var(--text); text-decoration: none; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${d.username}
        </a>
        <span class="text-dim" style="font-size: 0.7rem;">${d.postCount} posts</span>
      </div>
      <button class="btn btn--sm btn--ghost" 
              style="font-size: 0.75rem; padding: 4px 8px;" 
              data-follow-user="${d.username}"
              onclick="handleFollowFromSuggestion('${d.username}')">
        Follow
      </button>
    </div>
  `).join(""),U.innerHTML=a}window.handleFollowFromSuggestion=async t=>{const e=g.getUser();if(e)try{await g.followUser(t),M(e)}catch(n){console.error("Follow failed:",n)}};function re(){const t=document.querySelector(".gh-browser");if(t){t.remove();return}const e=document.createElement("div");_.style.position="relative",_.appendChild(e),new O({container:e,userRepos:B,onClose:()=>{e.remove()},onSelect:n=>{n.type==="repo"?(h=n.data,E()):n.type==="file"&&(h=n.repo,l={code:`(File: ${n.data.path})`,language:n.data.name.split(".").pop(),path:n.data.path,url:n.data.html_url},E(),C()),e.remove()}})}function k(){let t=document.getElementById("selectedActivityContainer");if(p){if(!t){t=document.createElement("div"),t.id="selectedActivityContainer";const o=document.getElementById("selectedCodeContainer"),s=document.getElementById("selectedRepoContainer");o?o.after(t):s?s.after(t):_.querySelector(".composer__header").after(t)}let e="📝",n="Activity";p.type==="commit"?(e="📝",n=`Commit on ${p.repo.name}`):p.type==="issue"?(e="🐛",n=`Issue #${p.issue.number}`):p.type==="pr"&&(e="🔀",n=`PR #${p.pr.number}`),t.innerHTML=`
      <div class="selected-repo" style="border-color: var(--accent);">
        ${e} ${n}
        <button class="selected-repo__remove" id="removeSelectedActivity">×</button>
      </div>
    `,document.getElementById("removeSelectedActivity").addEventListener("click",()=>{p=null,t.remove()})}else t&&t.remove()}function E(){let t=document.getElementById("selectedRepoContainer");h?(t||(t=document.createElement("div"),t.id="selectedRepoContainer",t.style.marginTop="var(--sp-2)",_.querySelector(".composer__header").after(t)),t.innerHTML=`
      <div class="selected-repo">
        📦 ${h.name}
        <button class="selected-repo__remove" id="removeSelectedRepo">×</button>
      </div>
    `,document.getElementById("removeSelectedRepo").addEventListener("click",()=>{h=null,t.remove()})):t&&t.remove()}function V(){var o;(o=document.getElementById("codeEditorModal"))==null||o.remove();const t=document.createElement("div");t.id="codeEditorModal",t.className="code-editor-modal",t.innerHTML=`
    <div class="code-editor-modal__content">
      <div class="code-editor-modal__header">
        <span class="code-editor-modal__title">💻 Add Code</span>
        <select class="code-editor-modal__lang" id="codeLangSelect">
          ${LANGUAGES.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}
        </select>
        <button class="code-editor-modal__close" id="closeCodeEditor">×</button>
      </div>
      <div class="code-editor-modal__body" id="codeEditorContainer"></div>
      <div class="code-editor-modal__footer">
        <button class="btn" id="cancelCode">Cancel</button>
        <button class="btn btn--primary" id="insertCode">Insert Code</button>
      </div>
    </div>
  `,document.body.appendChild(t);const e=document.getElementById("codeEditorContainer");f=new K(e,{language:"javascript",value:(l==null?void 0:l.code)||""}),l!=null&&l.language&&(document.getElementById("codeLangSelect").value=l.language,f.setLanguage(l.language)),document.getElementById("codeLangSelect").addEventListener("change",s=>{f.setLanguage(s.target.value)});const n=()=>{f==null||f.dispose(),f=null,t.remove()};document.getElementById("closeCodeEditor").addEventListener("click",n),document.getElementById("cancelCode").addEventListener("click",n),t.addEventListener("click",s=>{s.target===t&&n()}),document.getElementById("insertCode").addEventListener("click",()=>{const s=f.getValue().trim(),i=document.getElementById("codeLangSelect").value;s&&(l={code:s,language:i},C()),n()}),setTimeout(()=>f.focus(),100)}function C(){var e;let t=document.getElementById("selectedCodeContainer");if(l){if(!t){t=document.createElement("div"),t.id="selectedCodeContainer";const s=document.getElementById("selectedRepoContainer");s?s.after(t):_.querySelector(".composer__header").after(t)}const n=((e=LANGUAGES.find(s=>s.id===l.language))==null?void 0:e.name)||l.language,o=l.code.split(`
`)[0].substring(0,40)+(l.code.length>40?"...":"");t.innerHTML=`
      <div class="selected-code">
        <span class="selected-code__icon">💻</span>
        <div class="selected-code__info">
          <div class="selected-code__lang">${n}</div>
          <div class="selected-code__preview">${G(o)}</div>
        </div>
        <div class="selected-code__actions">
          <button class="selected-code__btn" id="editCode" title="Edit">✏️</button>
          <button class="selected-code__btn" id="removeCode" title="Remove">×</button>
        </div>
      </div>
    `,document.getElementById("editCode").addEventListener("click",V),document.getElementById("removeCode").addEventListener("click",()=>{l=null,t.remove()})}else t&&t.remove()}const le=()=>{const t=document.createElement("div");t.className="modal-overlay",document.body.appendChild(t),new Z(t,{onSelect:e=>{p=e,t.remove(),k()},onClose:()=>t.remove()})};function ce(){var e,n,o,s,i,a;(e=document.getElementById("postBtn"))==null||e.addEventListener("click",ge);const t=document.querySelectorAll(".composer__tool");(n=t[0])==null||n.addEventListener("click",re),(o=t[1])==null||o.addEventListener("click",V),(s=t[2])==null||s.addEventListener("click",le),(i=t[3])==null||i.addEventListener("click",pe),document.querySelectorAll(".feed-tab").forEach(d=>{d.addEventListener("click",r=>{document.querySelectorAll(".feed-tab").forEach(c=>c.classList.remove("feed-tab--active")),r.target.classList.add("feed-tab--active")})}),L.addEventListener("click",me),(a=document.getElementById("loadMoreBtn"))==null||a.addEventListener("click",d=>{d.target.textContent="No more posts",d.target.disabled=!0})}async function me(t){const e=t.target.closest(".code-block__copy");if(e){const i=decodeURIComponent(e.dataset.code);navigator.clipboard.writeText(i).then(()=>{e.textContent="✓",setTimeout(()=>e.textContent="📋",1500)});return}const n=t.target.closest(".post-card__action");if(!n)return;const o=n.dataset.action,s=n.dataset.postId;if(o==="react"&&s){const i=await u.reactToPost(s,"fire");if(i){const a=n.querySelector("span"),d=Object.values(i.reactions||{fire:0}).reduce((r,c)=>r+c,0);a.textContent=d,i.hasReacted?n.classList.add("post-card__action--active"):n.classList.remove("post-card__action--active")}}if(o==="delete"&&s&&await q.show({title:"Trash this post?",message:"You can restore it later from your profile Trash tab.",confirmText:"Move to Trash",theme:"copper"})){const a=g.getUser();await u.delete(s,a?a.username:null),$()}if(o==="restore"&&s&&await q.show({title:"Restore this post?",message:"This post will reappear in your feed.",confirmText:"Restore",theme:"moss"})&&(await u.restorePost(s),$()),o==="edit"&&s){const i=u.getPosts().find(a=>a.id===s);i&&te(i)}if(o==="history"&&s){const i=u.getPosts().find(a=>a.id===s);if(i&&i.versions){const a=i.versions.map(d=>`[${new Date(d.timestamp).toLocaleTimeString()}] ${d.content}`).join(`
---
`);alert(`Edit History:

${a}

(Current: ${i.content})`)}}if(o==="comment"&&s){const i=document.getElementById(`comments-${s}`);if(!i)return;const a=i.style.display!=="none";if(i.style.display=a?"none":"block",!a&&!i.dataset.initialized){const d=u.getPosts().find(r=>r.id===s);d&&(new Y(i,d,{onCommentAdded:r=>{const c=document.querySelector(`[data-action="comment"][data-post-id="${s}"] span`),b=parseInt(c.textContent)||0;c.textContent=b+1}}),i.dataset.initialized="true")}}}function ue(){h=null,l=null,p=null,v=null,E(),C(),k(),P()}function pe(){const t=document.createElement("div");document.body.appendChild(t),new ee(t,{onSelect:e=>{v=e,t.remove(),P()},onClose:()=>t.remove()})}function P(){let t=document.getElementById("selectedMediaContainer");if(v){if(!t){t=document.createElement("div"),t.id="selectedMediaContainer";const n=document.getElementById("selectedActivityContainer")||document.getElementById("selectedCodeContainer")||document.getElementById("selectedRepoContainer"),o=_.querySelector(".composer__header");n?n.after(t):o.after(t)}const e=v.type==="video"?"🎥":"🖼️";t.innerHTML=`
      <div class="selected-code">
        <div style="font-size: 1.5rem; margin-right: 12px;">${e}</div>
        <div class="selected-code__info">
          <div class="selected-code__lang">${v.type.toUpperCase()}</div>
          <div class="selected-code__preview" style="font-family: var(--font-sans);">${G(v.url)}</div>
        </div>
        <div class="selected-code__actions">
          <button class="selected-code__btn" id="removeMedia" title="Remove">×</button>
        </div>
      </div>
    `,document.getElementById("removeMedia").addEventListener("click",()=>{v=null,t.remove()})}else t&&t.remove()}async function ge(){const t=document.getElementById("composerInput"),e=document.getElementById("postBtn"),n=t.value.trim();if(!n&&!h&&!l&&!v)return;const o=h||l?"project":"thought",s=document.getElementById("postBtn");s.textContent,s.disabled=!0,s.textContent=w?"Saving...":"Posting...";try{const i={content:n,type:o,repo:h,code:l?{language:l.language,code:l.value,name:l.name}:null,activity:p,media:v};if(w){await u.edit(S,i),w=!1,S=null;const r=document.querySelector(".composer__title");r&&(r.textContent="New Post"),t.value="";const c=document.querySelector(".composer__cancel");c&&c.remove()}else await u.create(i);t.value="",ue(),$();let a=4;e.disabled=!0,e.textContent=`Wait ${a}s`;const d=setInterval(()=>{a--,a<=0?(clearInterval(d),e.disabled=!1,e.textContent="Post"):e.textContent=`Wait ${a}s`},1e3)}catch(i){console.error("[Feed] Post error:",i),alert("Failed to post: "+i.message),e.disabled=!1,e.textContent="Post"}}

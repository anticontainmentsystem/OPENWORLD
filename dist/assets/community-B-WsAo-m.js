import{a as h,u as H,f as N,p as g,b as U}from"./auth-qTptiIUO.js";/* empty css             */import{r as $,C as z,e as k,G as j,L as x,a as O}from"./PostCard-C_V0m3eT.js";/* empty css                       */class F{constructor(t,n={}){this.container=t,this.onSelect=n.onSelect||(()=>{}),this.onClose=n.onClose||(()=>{}),this.mode="all",this.events=[],this.loading=!1,this.init()}async init(){this.render(),this.loadEvents()}async loadEvents(){this.loading=!0,this.renderContent();try{const t=h.getUser();if(!t)throw new Error("Not logged in");this.events=await H.getEvents(t.username,t.accessToken)}catch(t){console.error("Failed to load events:",t),this.events=[]}finally{this.loading=!1,this.renderContent()}}render(){this.container.innerHTML=`
      <div class="gh-browser">
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
    `,this.bindEvents()}renderContent(){const t=this.container.querySelector(".gh-browser__content");if(!t)return;if(this.loading){t.innerHTML='<div class="gh-browser__loading">Loading activity...</div>';return}if(this.events.length===0){t.innerHTML='<div class="gh-browser__empty">No recent activity found.</div>';return}const n=this.mode==="all"?this.events.filter(s=>["PushEvent","IssuesEvent","PullRequestEvent"].includes(s.type)):this.events.filter(s=>s.type===this.mode);if(n.length===0){t.innerHTML='<div class="gh-browser__empty">No matching activity found.</div>';return}t.innerHTML=n.map(s=>this.renderEventItem(s)).join(""),this.bindContentEvents()}renderEventItem(t){var c;let n="📝",s="Activity",o="",i="Select",a=null;if(t.type==="PushEvent"){n="📝",s=`Pushed to ${t.repo.name}`;const l=t.payload.commits.length;o=`${l} commit${l===1?"":"s"}: ${((c=t.payload.commits[0])==null?void 0:c.message)||"No message"}`,a={type:"commit",repo:t.repo,commit:t.payload.commits[0],head:t.payload.head}}else t.type==="IssuesEvent"?(n="🐛",s=`${t.payload.action} issue in ${t.repo.name}`,o=`#${t.payload.issue.number}: ${t.payload.issue.title}`,a={type:"issue",repo:t.repo,issue:t.payload.issue}):t.type==="PullRequestEvent"&&(n="🔀",s=`${t.payload.action} PR in ${t.repo.name}`,o=`#${t.payload.pull_request.number}: ${t.payload.pull_request.title}`,a={type:"pr",repo:t.repo,pr:t.payload.pull_request});return`
      <div class="gh-item" data-payload='${JSON.stringify(a).replace(/'/g,"&#39;")}'>
        <div class="gh-item__icon">${n}</div>
        <div class="gh-item__details">
          <div class="gh-item__name">${s}</div>
          <div class="gh-item__desc">${o}</div>
          <div class="gh-item__meta text-dim text-xs">${N(t.created_at)}</div>
        </div>
        <div class="gh-item__actions">
          <button class="gh-btn gh-btn--sm gh-btn--primary" data-action="select">${i}</button>
        </div>
      </div>
    `}bindEvents(){const t=this.container.querySelector(".gh-browser");t.querySelector(".gh-browser__close").addEventListener("click",()=>this.onClose());const n=t.querySelectorAll(".gh-browser__tab");n.forEach(s=>{s.addEventListener("click",o=>{n.forEach(i=>i.classList.remove("gh-browser__tab--active")),o.target.classList.add("gh-browser__tab--active"),this.mode=o.target.dataset.tab,this.renderContent()})})}bindContentEvents(){this.container.querySelectorAll('.gh-btn[data-action="select"]').forEach(t=>{t.addEventListener("click",n=>{const s=n.target.closest(".gh-item");try{const o=JSON.parse(s.dataset.payload.replace(/&#39;/g,"'"));this.onSelect(o)}catch(o){console.error("Selection error",o)}})})}}const L=document.createElement("link");L.rel="stylesheet";L.href="/src/styles/comment.css";document.head.appendChild(L);const _=document.getElementById("userBadge"),y=document.getElementById("composer"),B=document.getElementById("loginPrompt"),b=document.getElementById("feedPosts"),I=document.getElementById("suggestions"),w=document.getElementById("userStats");let E=[],p=null,d=null,r=null,v=null,u=null;document.addEventListener("DOMContentLoaded",async()=>{D(),await G(),Q(),g.startPolling(4e3)});async function G(){b.innerHTML=`
    <div class="card" style="text-align: center; padding: var(--sp-5);">
      <div style="font-size: 1.5rem; margin-bottom: var(--sp-2);">⏳</div>
      <p class="text-dim">Loading posts...</p>
    </div>
  `,await g.loadPosts(),A(),C(h.getUser())}function D(){h.subscribe(C),C(h.getUser())}async function C(e){e?(V(e),y.style.display="block",B.style.display="none",w.style.display="block",document.getElementById("composerAvatar").src=e.avatar,document.getElementById("statFollowing").textContent=e.following||0,document.getElementById("statPosts").textContent=g.getPostsByUser(e.id).length,E=await U(),E.length===0&&e.repos&&(E=e.repos),S(e)):(W(),y.style.display="none",B.style.display="block",w.style.display="none",S(null))}function V(e){_.innerHTML=`
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
        <li><a href="/pillars/community/profile.html?edit=1" class="user-badge__dropdown-item">✏️ Edit Profile</a></li>
        <li class="user-badge__dropdown-divider"></li>
        <li><button class="user-badge__dropdown-item" id="logoutBtn">Sign Out</button></li>
      </ul>
    </div>
  `,document.getElementById("userBadgeTrigger").addEventListener("click",t=>{t.stopPropagation(),_.classList.toggle("user-badge--open")}),document.addEventListener("click",()=>_.classList.remove("user-badge--open")),document.getElementById("logoutBtn").addEventListener("click",()=>h.logout())}function W(){_.innerHTML=`
    <button class="user-badge__login" id="navLoginBtn">
      <svg class="github-icon" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sign In
    </button>
  `,document.getElementById("navLoginBtn").addEventListener("click",()=>h.login())}function A(){const e=g.getPosts();if(e.length===0){b.innerHTML=`
      <div class="card" style="text-align: center; padding: var(--sp-5);">
        <div style="font-size: 2rem; margin-bottom: var(--sp-2);">🌐</div>
        <h3 style="margin-bottom: var(--sp-1);">No posts yet</h3>
        <p class="text-dim">Be the first to share what you're building.</p>
      </div>
    `;return}b.innerHTML=e.map(t=>$(t)).join("")}function S(e){if(!e){I.innerHTML=`
      <p class="text-dim" style="font-size: 0.85rem;">Sign in to see suggestions</p>
    `;return}I.innerHTML=`
    <p class="text-dim" style="font-size: 0.85rem;">You're the first creator here! 🎉</p>
    <p class="text-dim" style="font-size: 0.8rem; margin-top: var(--sp-2);">Share a post to get started.</p>
  `}function J(){const e=document.querySelector(".gh-browser");if(e){e.remove();return}const t=document.createElement("div");y.style.position="relative",y.appendChild(t),new j({container:t,userRepos:E,onClose:()=>{t.remove()},onSelect:n=>{n.type==="repo"?(p=n.data,P()):n.type==="file"&&(p=n.repo,d={code:`(File: ${n.data.path})`,language:n.data.name.split(".").pop(),path:n.data.path,url:n.data.html_url},P(),T()),t.remove()}})}function Y(){let e=document.getElementById("selectedActivityContainer");if(r){if(!e){e=document.createElement("div"),e.id="selectedActivityContainer";const s=document.getElementById("selectedCodeContainer"),o=document.getElementById("selectedRepoContainer");s?s.after(e):o?o.after(e):y.querySelector(".composer__header").after(e)}let t="📝",n="Activity";r.type==="commit"?(t="📝",n=`Commit on ${r.repo.name}`):r.type==="issue"?(t="🐛",n=`Issue #${r.issue.number}`):r.type==="pr"&&(t="🔀",n=`PR #${r.pr.number}`),e.innerHTML=`
      <div class="selected-repo" style="border-color: var(--accent);">
        ${t} ${n}
        <button class="selected-repo__remove" id="removeSelectedActivity">×</button>
      </div>
    `,document.getElementById("removeSelectedActivity").addEventListener("click",()=>{r=null,e.remove()})}else e&&e.remove()}function P(){let e=document.getElementById("selectedRepoContainer");p?(e||(e=document.createElement("div"),e.id="selectedRepoContainer",e.style.marginTop="var(--sp-2)",y.querySelector(".composer__header").after(e)),e.innerHTML=`
      <div class="selected-repo">
        📦 ${p.name}
        <button class="selected-repo__remove" id="removeSelectedRepo">×</button>
      </div>
    `,document.getElementById("removeSelectedRepo").addEventListener("click",()=>{p=null,e.remove()})):e&&e.remove()}function M(){var s;(s=document.getElementById("codeEditorModal"))==null||s.remove();const e=document.createElement("div");e.id="codeEditorModal",e.className="code-editor-modal",e.innerHTML=`
    <div class="code-editor-modal__content">
      <div class="code-editor-modal__header">
        <span class="code-editor-modal__title">💻 Add Code</span>
        <select class="code-editor-modal__lang" id="codeLangSelect">
          ${x.map(o=>`<option value="${o.id}">${o.name}</option>`).join("")}
        </select>
        <button class="code-editor-modal__close" id="closeCodeEditor">×</button>
      </div>
      <div class="code-editor-modal__body" id="codeEditorContainer"></div>
      <div class="code-editor-modal__footer">
        <button class="btn" id="cancelCode">Cancel</button>
        <button class="btn btn--primary" id="insertCode">Insert Code</button>
      </div>
    </div>
  `,document.body.appendChild(e);const t=document.getElementById("codeEditorContainer");u=new O(t,{language:"javascript",value:(d==null?void 0:d.code)||""}),d!=null&&d.language&&(document.getElementById("codeLangSelect").value=d.language,u.setLanguage(d.language)),document.getElementById("codeLangSelect").addEventListener("change",o=>{u.setLanguage(o.target.value)});const n=()=>{u==null||u.dispose(),u=null,e.remove()};document.getElementById("closeCodeEditor").addEventListener("click",n),document.getElementById("cancelCode").addEventListener("click",n),e.addEventListener("click",o=>{o.target===e&&n()}),document.getElementById("insertCode").addEventListener("click",()=>{const o=u.getValue().trim(),i=document.getElementById("codeLangSelect").value;o&&(d={code:o,language:i},T()),n()}),setTimeout(()=>u.focus(),100)}function T(){var t;let e=document.getElementById("selectedCodeContainer");if(d){if(!e){e=document.createElement("div"),e.id="selectedCodeContainer";const o=document.getElementById("selectedRepoContainer");o?o.after(e):y.querySelector(".composer__header").after(e)}const n=((t=x.find(o=>o.id===d.language))==null?void 0:t.name)||d.language,s=d.code.split(`
`)[0].substring(0,40)+(d.code.length>40?"...":"");e.innerHTML=`
      <div class="selected-code">
        <span class="selected-code__icon">💻</span>
        <div class="selected-code__info">
          <div class="selected-code__lang">${n}</div>
          <div class="selected-code__preview">${k(s)}</div>
        </div>
        <div class="selected-code__actions">
          <button class="selected-code__btn" id="editCode" title="Edit">✏️</button>
          <button class="selected-code__btn" id="removeCode" title="Remove">×</button>
        </div>
      </div>
    `,document.getElementById("editCode").addEventListener("click",M),document.getElementById("removeCode").addEventListener("click",()=>{d=null,e.remove()})}else e&&e.remove()}const K=()=>{const e=document.createElement("div");e.className="modal-overlay",document.body.appendChild(e),new F(e,{onSelect:t=>{r=t,e.remove(),Y()},onClose:()=>e.remove()})};function Q(){var t,n,s,o,i,a;(t=document.getElementById("postBtn"))==null||t.addEventListener("click",te);const e=document.querySelectorAll(".composer__tool");(n=e[0])==null||n.addEventListener("click",J),(s=e[1])==null||s.addEventListener("click",M),(o=e[2])==null||o.addEventListener("click",K),(i=e[3])==null||i.addEventListener("click",Z),document.querySelectorAll(".feed-tab").forEach(c=>{c.addEventListener("click",l=>{document.querySelectorAll(".feed-tab").forEach(m=>m.classList.remove("feed-tab--active")),l.target.classList.add("feed-tab--active")})}),b.addEventListener("click",X),(a=document.getElementById("loadMoreBtn"))==null||a.addEventListener("click",c=>{c.target.textContent="No more posts",c.target.disabled=!0})}async function X(e){const t=e.target.closest(".code-block__copy");if(t){const i=decodeURIComponent(t.dataset.code);navigator.clipboard.writeText(i).then(()=>{t.textContent="✓",setTimeout(()=>t.textContent="📋",1500)});return}const n=e.target.closest(".post-card__action");if(!n)return;const s=n.dataset.action,o=n.dataset.postId;if(s==="react"&&o){const i=await g.reactToPost(o,"fire");if(i){const a=n.querySelector("span"),c=Object.values(i.reactions||{fire:0}).reduce((l,m)=>l+m,0);a.textContent=c,i.hasReacted?n.classList.add("post-card__action--active"):n.classList.remove("post-card__action--active")}}if(s==="delete"&&o&&confirm("Delete this post?")&&(g.deletePost(o),A(),R()),s==="comment"&&o){const i=document.getElementById(`comments-${o}`);if(!i)return;const a=i.style.display!=="none";if(i.style.display=a?"none":"block",!a&&!i.dataset.initialized){const c=g.getPosts().find(l=>l.id===o);c&&(new z(i,c,{onCommentAdded:l=>{const m=document.querySelector(`[data-action="comment"][data-post-id="${o}"] span`),f=parseInt(m.textContent)||0;m.textContent=f+1}}),i.dataset.initialized="true")}}}function Z(){const e=prompt(`Enter Image or Video URL (http... or github://...)

Supported: jpg, png, gif, mp4, webm`);if(!e)return;let t="image";e.match(/\.(mp4|webm|mov)$/i)&&(t="video"),v={type:t,url:e},ee()}function ee(){let e=document.getElementById("selectedMediaContainer");if(v){if(!e){e=document.createElement("div"),e.id="selectedMediaContainer";const n=document.getElementById("selectedActivityContainer")||document.getElementById("selectedCodeContainer")||document.getElementById("selectedRepoContainer"),s=y.querySelector(".composer__header");n?n.after(e):s.after(e)}const t=v.type==="video"?"🎥":"🖼️";e.innerHTML=`
      <div class="selected-code">
        <div style="font-size: 1.5rem; margin-right: 12px;">${t}</div>
        <div class="selected-code__info">
          <div class="selected-code__lang">${v.type.toUpperCase()}</div>
          <div class="selected-code__preview" style="font-family: var(--font-sans);">${k(v.url)}</div>
        </div>
        <div class="selected-code__actions">
          <button class="selected-code__btn" id="removeMedia" title="Remove">×</button>
        </div>
      </div>
    `,document.getElementById("removeMedia").addEventListener("click",()=>{v=null,e.remove()})}else e&&e.remove()}async function te(){var o,i,a,c;const e=document.getElementById("composerInput"),t=document.getElementById("postBtn"),n=e.value.trim();if(!n&&!d){e.focus();return}t.disabled=!0,t.textContent="Posting...";let s="thought";p?s="release":d?s="commit":r&&(s="activity");try{const l=await g.createPost({content:n,type:s,repo:p,code:d,activity:r,media:v});b.insertAdjacentHTML("afterbegin",$(l));const m=b.querySelector(".card");m&&(m.textContent.includes("No posts")||m.textContent.includes("Loading"))&&m.remove(),e.value="",p=null,d=null,r=null,v=null,(o=document.getElementById("selectedRepoContainer"))==null||o.remove(),(i=document.getElementById("selectedCodeContainer"))==null||i.remove(),(a=document.getElementById("selectedActivityContainer"))==null||a.remove(),(c=document.getElementById("selectedMediaContainer"))==null||c.remove(),R();let f=4;t.disabled=!0,t.textContent=`Wait ${f}s`;const q=setInterval(()=>{f--,f<=0?(clearInterval(q),t.disabled=!1,t.textContent="Post"):t.textContent=`Wait ${f}s`},1e3)}catch(l){console.error("[Feed] Post error:",l),alert("Failed to post: "+l.message),t.disabled=!1,t.textContent="Post"}}function R(){const e=h.getUser();e&&(document.getElementById("statPosts").textContent=g.getPostsByUser(e.username||e.id).length)}console.log("%c◈ OpenWorld Community","color: #b87333; font-size: 16px; font-weight: bold;");

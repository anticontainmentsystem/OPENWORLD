import{a as g}from"./auth-BoBc4x_h.js";/* empty css             */import{f as S,r as L}from"./UserBadge-BLCkjwZb.js";import"./NotificationDropdown-Cul7GRCK.js";const v={coding:"#79c0ff",art:"#f778ba",music:"#d2a8ff",writing:"#a5d6ff",engineering:"#79c0ff",photography:"#ffa657",design:"#ff7b72",science:"#56d364",craft:"#e3b341",other:"#8b949e"};function I(a){const e=Math.floor((Date.now()-new Date(a).getTime())/1e3);if(e<60)return"just now";const t=Math.floor(e/60);if(t<60)return`${t}m ago`;const r=Math.floor(t/60);if(r<24)return`${r}h ago`;const s=Math.floor(r/24);return s<30?`${s}d ago`:`${Math.floor(s/30)}mo ago`}class q{constructor(e,t={}){this.frame=e,this.onClick=t.onClick||(()=>{})}render(){const e=this.frame,t=v[e.category]||v.other,r=e.status==="archived",s=document.createElement("a");return s.href=`/pillars/knowledge/frame.html?id=${e.id}`,s.className=`frame-card${r?" frame-card--archived":""}`,s.onclick=n=>{this.onClick(e,n)===!1&&n.preventDefault()},s.innerHTML=`
      <div class="frame-card__header">
        <span class="frame-card__icon">${e.icon||"📡"}</span>
        <span class="frame-card__category" style="color: ${t}">${e.category}${e.subcategory?` / ${this.escapeHtml(e.subcategory)}`:""}</span>
        ${r?'<span class="frame-card__status">archived</span>':""}
      </div>
      <h3 class="frame-card__title">${this.escapeHtml(e.title)}</h3>
      <p class="frame-card__desc">${this.escapeHtml(e.description)}</p>
      ${e.tags&&e.tags.length>0?`
        <div class="frame-card__tags">
          ${e.tags.map(n=>`<span class="frame-card__tag">${this.escapeHtml(n)}</span>`).join("")}
        </div>
      `:""}
      <div class="frame-card__meta">
        <img src="${e.creatorAvatar}" alt="${e.creatorUsername}" class="frame-card__avatar">
        <span class="frame-card__creator">${this.escapeHtml(e.creatorUsername)}</span>
        <span class="frame-card__dot">·</span>
        <span class="frame-card__members">${e.memberCount||1} member${(e.memberCount||1)!==1?"s":""}</span>
        <span class="frame-card__dot">·</span>
        <span class="frame-card__time">${I(e.lastActivityAt||e.createdAt)}</span>
      </div>
    `,s}escapeHtml(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}}const A=[{id:"coding",label:"Coding",icon:"💻"},{id:"art",label:"Art",icon:"🎨"},{id:"music",label:"Music",icon:"🎵"},{id:"writing",label:"Writing",icon:"✍️"},{id:"engineering",label:"Engineering",icon:"⚙️"},{id:"photography",label:"Photography",icon:"📷"},{id:"design",label:"Design",icon:"🖌️"},{id:"science",label:"Science",icon:"🔬"},{id:"craft",label:"Craft",icon:"🛠️"},{id:"other",label:"Other",icon:"📡"}];class F{constructor(e={}){this.onCreated=e.onCreated||(()=>{}),this.overlay=null,this.selectedCategory=null}open(){if(!g.getUser()){g.login();return}this.overlay=document.createElement("div"),this.overlay.className="modal-overlay",this.overlay.innerHTML=`
      <div class="modal-panel frame-create-modal">
        <div class="modal-panel__header">
          <h2>Create a Frame</h2>
          <button class="modal-close" id="modalClose">×</button>
        </div>
        <div class="modal-panel__body">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" class="form-input" id="frameTitle" placeholder="e.g. Rust for Embedded Systems" maxlength="100">
            <span class="form-hint">3-100 characters</span>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-input form-textarea" id="frameDesc" placeholder="What is this frame about? What will people find here?" maxlength="500" rows="3"></textarea>
            <span class="form-hint">10-500 characters</span>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <div class="category-grid" id="categoryGrid">
              ${A.map(t=>`
                <button class="category-chip" data-cat="${t.id}">
                  <span>${t.icon}</span>
                  <span>${t.label}</span>
                </button>
              `).join("")}
            </div>
          </div>
          <div class="form-group" id="subcategoryGroup" style="display: none;">
            <label class="form-label">Subcategory <span class="form-hint-inline">(optional — refine within the main category)</span></label>
            <input type="text" class="form-input" id="frameSubcategory" placeholder="e.g. Embedded, Watercolor, Jazz Theory" maxlength="40">
            <span class="form-hint">Custom niche under the selected category</span>
          </div>
          <div class="form-group">
            <label class="form-label">Tags <span class="form-hint-inline">(optional, up to 5)</span></label>
            <input type="text" class="form-input" id="frameTags" placeholder="rust, embedded, hardware (comma-separated)">
          </div>
          <div class="form-group">
            <label class="form-label">Icon <span class="form-hint-inline">(optional emoji)</span></label>
            <input type="text" class="form-input form-input--sm" id="frameIcon" placeholder="🦀" maxlength="4" style="width: 80px;">
          </div>
          <div id="createError" class="form-error" style="display: none;"></div>
        </div>
        <div class="modal-panel__footer">
          <button class="btn btn--outline" id="modalCancel">Cancel</button>
          <button class="btn btn--primary" id="modalCreate">Create Frame</button>
        </div>
      </div>
    `,document.body.appendChild(this.overlay),this.bindEvents(),requestAnimationFrame(()=>{var t;(t=this.overlay.querySelector("#frameTitle"))==null||t.focus()})}close(){this.overlay&&(this.overlay.remove(),this.overlay=null)}bindEvents(){this.overlay.querySelector("#modalClose").onclick=()=>this.close(),this.overlay.querySelector("#modalCancel").onclick=()=>this.close(),this.overlay.onclick=e=>{e.target===this.overlay&&this.close()},this.overlay.querySelectorAll(".category-chip").forEach(e=>{e.onclick=()=>{this.overlay.querySelectorAll(".category-chip").forEach(r=>r.classList.remove("active")),e.classList.add("active"),this.selectedCategory=e.dataset.cat;const t=this.overlay.querySelector("#subcategoryGroup");t&&(t.style.display="block")}}),this.overlay.querySelector("#modalCreate").onclick=()=>this.handleCreate(),this.overlay.querySelector("#frameTitle").onkeydown=e=>{e.key==="Enter"&&this.handleCreate()}}async handleCreate(){const e=this.overlay.querySelector("#frameTitle").value.trim(),t=this.overlay.querySelector("#frameDesc").value.trim(),r=this.selectedCategory,s=this.overlay.querySelector("#frameSubcategory").value.trim(),n=this.overlay.querySelector("#frameTags").value.trim(),k=this.overlay.querySelector("#frameIcon").value.trim(),o=this.overlay.querySelector("#createError");if(!e||e.length<3){o.textContent="Title must be at least 3 characters.",o.style.display="block";return}if(!t||t.length<10){o.textContent="Description must be at least 10 characters.",o.style.display="block";return}if(!r){o.textContent="Please select a category.",o.style.display="block";return}o.style.display="none";const x=n?n.split(",").map(c=>c.trim().toLowerCase()).filter(Boolean).slice(0,5):[],f=this.overlay.querySelector("#modalCreate");f.disabled=!0,f.textContent="Creating...";try{const c=await S.create({title:e,description:t,category:r,subcategory:s||void 0,tags:x,icon:k||void 0});this.close(),this.onCreated(c)}catch(c){o.textContent=c.message,o.style.display="block",f.disabled=!1,f.textContent="Create Frame"}}}const M=document.getElementById("userBadge"),i=document.getElementById("framesGrid"),p=document.getElementById("knowledgeSearch"),h=document.getElementById("categoryTabs"),H=document.getElementById("createFrameBtn"),D=document.getElementById("heroCreateBtn"),G=document.getElementById("ctaCreateBtn"),u=document.getElementById("frameCount"),b=document.getElementById("categoryCards"),C=document.getElementById("statFrames"),_=document.getElementById("statContributors");let l=[],d="all",m="",E=null;function O(){R(),y(),j()}function R(){L(M)}async function y(){i.innerHTML='<p class="text-dim" style="padding: var(--sp-4);">Loading frames...</p>';try{const a={};d!=="all"&&(a.category=d),m&&(a.search=m),l=await S.getAll(a),T(),w()}catch(a){i.innerHTML='<p class="text-dim" style="padding: var(--sp-4);">Failed to load frames.</p>',console.error("[Knowledge] Load error:",a)}}function T(){if(C&&(C.textContent=l.length),_){const a=new Set(l.map(e=>e.creatorId));_.textContent=a.size}}function w(){var a;if(i.innerHTML="",l.length===0){const e=d!=="all"?` in <strong>${d}</strong>`:"",t=m?` matching "<strong>${N(m)}</strong>"`:"";i.innerHTML=`
      <div class="frames-empty">
        <div class="frames-empty__icon">📡</div>
        <h3 class="frames-empty__title">No frames yet${e||t?"":" — be the first"}</h3>
        <p class="frames-empty__desc">
          ${e||t?`No frames found${e}${t}. Try a different filter or create one yourself.`:"Frames are living knowledge spaces where communities discuss, share resources, and build understanding together. Start one and see what grows."}
        </p>
        <div class="frames-empty__cta">
          <button class="btn btn--primary" id="emptyCreateBtn">+ Create the First Frame</button>
        </div>
      </div>
    `,(a=document.getElementById("emptyCreateBtn"))==null||a.addEventListener("click",B),u&&(u.textContent="0 frames");return}l.forEach(e=>{const t=new q(e);i.appendChild(t.render())}),u&&(u.textContent=`${l.length} frame${l.length!==1?"s":""}`)}function B(){new F({onCreated:e=>{e.frame&&(l.unshift(e.frame),T(),w())}}).open()}function $(a){d=a,h&&h.querySelectorAll(".category-tab").forEach(e=>{e.classList.toggle("active",(e.dataset.category||"all")===a)}),y()}function j(){p&&p.addEventListener("input",()=>{clearTimeout(E),E=setTimeout(()=>{m=p.value.trim(),y()},400)}),h&&h.addEventListener("click",a=>{const e=a.target.closest(".category-tab");e&&$(e.dataset.category||"all")}),b&&b.addEventListener("click",a=>{var r;const e=a.target.closest(".k-cat-card");if(!e)return;const t=e.dataset.category;t&&($(t),(r=document.getElementById("frames-listing"))==null||r.scrollIntoView({behavior:"smooth"}))}),[H,D,G].forEach(a=>{a&&a.addEventListener("click",B)})}function N(a){if(!a)return"";const e=document.createElement("div");return e.textContent=a,e.innerHTML}O();

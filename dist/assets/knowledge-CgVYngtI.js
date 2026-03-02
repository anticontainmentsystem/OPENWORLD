import{a as p}from"./auth-BoBc4x_h.js";/* empty css             */import{f as S,r as A}from"./UserBadge-CsCgkBFf.js";import"./NotificationDropdown-Cul7GRCK.js";const b={coding:"#79c0ff",art:"#f778ba",music:"#d2a8ff",writing:"#a5d6ff",engineering:"#79c0ff",photography:"#ffa657",design:"#ff7b72",science:"#56d364",craft:"#e3b341",performance:"#f0883e",film:"#bc8cff",games:"#3fb950","light-art":"#f8e45c","mixed-media":"#da70d6",architecture:"#8b949e",cuisine:"#f78166",language:"#7ee8fa",nature:"#7ee787",wellness:"#f2cc60",other:"#8b949e"};function q(a){const e=Math.floor((Date.now()-new Date(a).getTime())/1e3);if(e<60)return"just now";const t=Math.floor(e/60);if(t<60)return`${t}m ago`;const s=Math.floor(t/60);if(s<24)return`${s}h ago`;const r=Math.floor(s/24);return r<30?`${r}d ago`:`${Math.floor(r/30)}mo ago`}class M{constructor(e,t={}){this.frame=e,this.onClick=t.onClick||(()=>{})}render(){const e=this.frame,t=b[e.category]||b.other,s=e.status==="archived",r=document.createElement("a");return r.href=`/pillars/knowledge/frame.html?id=${e.id}`,r.className=`frame-card${s?" frame-card--archived":""}`,r.onclick=n=>{this.onClick(e,n)===!1&&n.preventDefault()},r.innerHTML=`
      <div class="frame-card__header">
        <span class="frame-card__icon">${e.icon||"📡"}</span>
        <span class="frame-card__category" style="color: ${t}">${e.category}${e.subcategory?` / ${this.escapeHtml(e.subcategory)}`:""}</span>
        ${s?'<span class="frame-card__status">archived</span>':""}
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
        <span class="frame-card__time">${q(e.lastActivityAt||e.createdAt)}</span>
      </div>
    `,r}escapeHtml(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}}const x=[{id:"coding",label:"Coding",icon:"💻"},{id:"art",label:"Art",icon:"🎨"},{id:"music",label:"Music",icon:"🎵"},{id:"writing",label:"Writing",icon:"✍️"},{id:"engineering",label:"Engineering",icon:"⚙️"},{id:"photography",label:"Photography",icon:"📷"},{id:"design",label:"Design",icon:"🖌️"},{id:"science",label:"Science",icon:"🔬"},{id:"craft",label:"Craft",icon:"🛠️"},{id:"performance",label:"Performance",icon:"🎭"},{id:"film",label:"Film",icon:"🎬"},{id:"games",label:"Games",icon:"🎮"},{id:"light-art",label:"Light Art",icon:"💡"},{id:"mixed-media",label:"Mixed Media",icon:"🧩"},{id:"architecture",label:"Architecture",icon:"🏛️"},{id:"cuisine",label:"Cuisine",icon:"🍳"},{id:"language",label:"Language",icon:"🗣️"},{id:"nature",label:"Nature",icon:"🌿"},{id:"wellness",label:"Wellness",icon:"💪"},{id:"other",label:"Other",icon:"📡"}],F=new Set(x.flatMap(a=>[a.id,a.label.toLowerCase()]));function v(a){const e=a.trim();if(!e)return null;if(e.length<2)return"Subcategory must be at least 2 characters.";if(e.length>40)return"Subcategory must be under 40 characters.";const t=e.toLowerCase();if(F.has(t))return`"${e}" is already a main category — no need to add it as a subcategory.`;if(t.length>5&&t.endsWith("ing")){let r=t.slice(0,-3);return r.length>2&&r[r.length-1]===r[r.length-2]?r=r.slice(0,-1):/[bcdfghjklmnpqrstvwxyz]$/.test(r)&&(r=r+"e"),`Use the noun form instead: "${r.charAt(0).toUpperCase()+r.slice(1)}" (not "${e}").`}return null}class H{constructor(e={}){this.onCreated=e.onCreated||(()=>{}),this.overlay=null,this.selectedCategory=null}open(){if(!p.getUser()){p.login();return}this.overlay=document.createElement("div"),this.overlay.className="modal-overlay",this.overlay.innerHTML=`
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
              ${x.map(t=>`
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
            <span class="form-hint" id="subHint">Use a noun — e.g. "Woodwork" not "Woodworking"</span>
            <span class="form-hint" id="subError" style="color: #ff6b6b; display: none;"></span>
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
    `,document.body.appendChild(this.overlay),this.bindEvents(),requestAnimationFrame(()=>{var t;(t=this.overlay.querySelector("#frameTitle"))==null||t.focus()})}close(){this.overlay&&(this.overlay.remove(),this.overlay=null)}bindEvents(){this.overlay.querySelector("#modalClose").onclick=()=>this.close(),this.overlay.querySelector("#modalCancel").onclick=()=>this.close(),this.overlay.onclick=s=>{s.target===this.overlay&&this.close()},this.overlay.querySelectorAll(".category-chip").forEach(s=>{s.onclick=()=>{this.overlay.querySelectorAll(".category-chip").forEach(n=>n.classList.remove("active")),s.classList.add("active"),this.selectedCategory=s.dataset.cat;const r=this.overlay.querySelector("#subcategoryGroup");r&&(r.style.display="block")}});const e=this.overlay.querySelector("#frameSubcategory"),t=this.overlay.querySelector("#subError");e&&t&&e.addEventListener("input",()=>{const s=v(e.value);s?(t.textContent=s,t.style.display="block"):t.style.display="none"}),this.overlay.querySelector("#modalCreate").onclick=()=>this.handleCreate(),this.overlay.querySelector("#frameTitle").onkeydown=s=>{s.key==="Enter"&&this.handleCreate()}}async handleCreate(){const e=this.overlay.querySelector("#frameTitle").value.trim(),t=this.overlay.querySelector("#frameDesc").value.trim(),s=this.selectedCategory,r=this.overlay.querySelector("#frameSubcategory").value.trim(),n=this.overlay.querySelector("#frameTags").value.trim(),B=this.overlay.querySelector("#frameIcon").value.trim(),o=this.overlay.querySelector("#createError");if(!e||e.length<3){o.textContent="Title must be at least 3 characters.",o.style.display="block";return}if(!t||t.length<10){o.textContent="Description must be at least 10 characters.",o.style.display="block";return}if(!s){o.textContent="Please select a category.",o.style.display="block";return}if(r){const l=v(r);if(l){o.textContent=l,o.style.display="block";return}}o.style.display="none";const I=n?n.split(",").map(l=>l.trim().toLowerCase()).filter(Boolean).slice(0,5):[],u=this.overlay.querySelector("#modalCreate");u.disabled=!0,u.textContent="Creating...";try{const l=await S.create({title:e,description:t,category:s,subcategory:r||void 0,tags:I,icon:B||void 0});this.close(),this.onCreated(l)}catch(l){o.textContent=l.message,o.style.display="block",u.disabled=!1,u.textContent="Create Frame"}}}const G=document.getElementById("userBadge"),c=document.getElementById("framesGrid"),g=document.getElementById("knowledgeSearch"),h=document.getElementById("categoryTabs"),D=document.getElementById("createFrameBtn"),W=document.getElementById("heroCreateBtn"),N=document.getElementById("ctaCreateBtn"),f=document.getElementById("frameCount"),C=document.getElementById("categoryCards"),E=document.getElementById("statFrames"),_=document.getElementById("statContributors");let i=[],d="all",m="",$=null;function U(){O(),y(),R()}function O(){A(G)}async function y(){c.innerHTML='<p class="text-dim" style="padding: var(--sp-4);">Loading frames...</p>';try{const a={};d!=="all"&&(a.category=d),m&&(a.search=m),i=await S.getAll(a),k(),L()}catch(a){c.innerHTML='<p class="text-dim" style="padding: var(--sp-4);">Failed to load frames.</p>',console.error("[Knowledge] Load error:",a)}}function k(){if(E&&(E.textContent=i.length),_){const a=new Set(i.map(e=>e.creatorId));_.textContent=a.size}}function L(){var a;if(c.innerHTML="",i.length===0){const e=d!=="all"?` in <strong>${d}</strong>`:"",t=m?` matching "<strong>${j(m)}</strong>"`:"";c.innerHTML=`
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
    `,(a=document.getElementById("emptyCreateBtn"))==null||a.addEventListener("click",T),f&&(f.textContent="0 frames");return}i.forEach(e=>{const t=new M(e);c.appendChild(t.render())}),f&&(f.textContent=`${i.length} frame${i.length!==1?"s":""}`)}function T(){new H({onCreated:e=>{e.frame&&(i.unshift(e.frame),k(),L())}}).open()}function w(a){d=a,h&&h.querySelectorAll(".category-tab").forEach(e=>{e.classList.toggle("active",(e.dataset.category||"all")===a)}),y()}function R(){g&&g.addEventListener("input",()=>{clearTimeout($),$=setTimeout(()=>{m=g.value.trim(),y()},400)}),h&&h.addEventListener("click",a=>{const e=a.target.closest(".category-tab");e&&w(e.dataset.category||"all")}),C&&C.addEventListener("click",a=>{var s;const e=a.target.closest(".k-cat-card");if(!e)return;const t=e.dataset.category;t&&(w(t),(s=document.getElementById("frames-listing"))==null||s.scrollIntoView({behavior:"smooth"}))}),[D,W,N].forEach(a=>{a&&a.addEventListener("click",T)})}function j(a){if(!a)return"";const e=document.createElement("div");return e.textContent=a,e.innerHTML}U();

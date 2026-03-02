import{a as f}from"./auth-BoBc4x_h.js";/* empty css             */import{a as p,b as y,r as B,f as x,c as w,d as I}from"./UserBadge-CsCgkBFf.js";import"./NotificationDropdown-Cul7GRCK.js";function $(r){const e=Math.floor((Date.now()-new Date(r).getTime())/1e3);if(e<60)return"just now";const t=Math.floor(e/60);if(t<60)return`${t}m ago`;const n=Math.floor(t/60);if(n<24)return`${n}h ago`;const s=Math.floor(n/24);return s<30?`${s}d ago`:`${Math.floor(s/30)}mo ago`}function o(r){if(!r)return"";const e=document.createElement("div");return e.textContent=r,e.innerHTML}class E{constructor(e,t,n,s={}){this.container=e,this.section=t,this.frameId=n,this.isCreator=s.isCreator||!1,this.onUpdate=s.onUpdate||(()=>{}),this.expandedThread=null,this.render()}render(){const e=this.section,t=f.getUser();e.type==="discussion"?this.renderDiscussion(e,t):e.type==="resources"?this.renderResources(e,t):e.type==="faq"&&this.renderFaq(e,t)}renderDiscussion(e,t){const n=(e.threads||[]).filter(d=>!d.deleted),s=n.filter(d=>d.pinned),a=n.filter(d=>!d.pinned),i=[...s,...a];this.container.innerHTML=`
      <div class="frame-section frame-section--discussion">
        <div class="frame-section__header">
          <h3>${o(e.title)}</h3>
          <span class="frame-section__count">${n.length} thread${n.length!==1?"s":""}</span>
        </div>
        ${t?`
          <div class="frame-section__composer">
            <input type="text" class="form-input" id="newThreadTitle_${e.id}" placeholder="Start a new thread..." maxlength="150">
            <textarea class="form-input form-textarea" id="newThreadContent_${e.id}" placeholder="What's on your mind?" rows="2" maxlength="5000" style="display: none;"></textarea>
            <button class="btn btn--primary btn--sm" id="postThread_${e.id}" style="display: none;">Post Thread</button>
          </div>
        `:""}
        <div class="frame-section__list" id="threadList_${e.id}">
          ${i.length>0?i.map(d=>this.renderThread(d,e.id)).join(""):'<p class="text-dim text-sm">No threads yet. Start the conversation.</p>'}
        </div>
      </div>
    `,this.bindDiscussionEvents(e,t)}renderThread(e,t){const n=(e.replies||[]).filter(a=>!a.deleted).length,s=this.expandedThread===e.id;return`
      <div class="thread-item${e.pinned?" thread-item--pinned":""}${e.locked?" thread-item--locked":""}" data-thread-id="${e.id}" data-section-id="${t}">
        <div class="thread-item__main" data-toggle-thread="${e.id}">
          <div class="thread-item__header">
            ${e.pinned?'<span class="thread-badge thread-badge--pin">📌</span>':""}
            ${e.locked?'<span class="thread-badge thread-badge--lock">🔒</span>':""}
            <img src="${e.authorAvatar}" alt="${e.authorUsername}" class="thread-item__avatar">
            <strong class="thread-item__author">${o(e.authorUsername)}</strong>
            <span class="thread-item__time">${$(e.createdAt)}</span>
          </div>
          <h4 class="thread-item__title">${o(e.title)}</h4>
          <p class="thread-item__preview">${o(e.content.substring(0,200))}${e.content.length>200?"...":""}</p>
          <span class="thread-item__replies">${n} repl${n!==1?"ies":"y"}</span>
        </div>
        ${s?this.renderExpandedThread(e,t):""}
      </div>
    `}renderExpandedThread(e,t){const n=f.getUser(),s=(e.replies||[]).filter(a=>!a.deleted);return`
      <div class="thread-expanded">
        <div class="thread-expanded__content">${o(e.content)}</div>
        ${this.isCreator?`
          <div class="thread-expanded__actions">
            <button class="btn btn--sm btn--outline" data-action="pin" data-thread-id="${e.id}" data-section-id="${t}">${e.pinned?"Unpin":"Pin"}</button>
            <button class="btn btn--sm btn--outline" data-action="lock" data-thread-id="${e.id}" data-section-id="${t}">${e.locked?"Unlock":"Lock"}</button>
            <button class="btn btn--sm btn--danger" data-action="delete-thread" data-thread-id="${e.id}" data-section-id="${t}">Delete</button>
          </div>
        `:""}
        <div class="thread-replies">
          ${s.map(a=>`
            <div class="reply-item" data-reply-id="${a.id}">
              <img src="${a.authorAvatar}" alt="${a.authorUsername}" class="reply-item__avatar">
              <div class="reply-item__body">
                <div class="reply-item__header">
                  <strong>${o(a.authorUsername)}</strong>
                  <span class="reply-item__time">${$(a.createdAt)}</span>
                </div>
                <p>${o(a.content)}</p>
              </div>
            </div>
          `).join("")}
        </div>
        ${n&&!e.locked?`
          <div class="thread-reply-composer">
            <input type="text" class="form-input" id="replyInput_${e.id}" placeholder="Write a reply..." maxlength="3000">
            <button class="btn btn--primary btn--sm" id="replyBtn_${e.id}">Reply</button>
          </div>
        `:""}
        ${e.locked?'<p class="text-dim text-sm">This thread is locked.</p>':""}
      </div>
    `}bindDiscussionEvents(e,t){const n=this.container.querySelector(`#newThreadTitle_${e.id}`),s=this.container.querySelector(`#newThreadContent_${e.id}`),a=this.container.querySelector(`#postThread_${e.id}`);n&&(n.onfocus=()=>{s.style.display="block",a.style.display="inline-flex"}),a&&(a.onclick=()=>this.handleCreateThread(e.id)),this.container.addEventListener("click",i=>{const d=i.target.closest("[data-toggle-thread]");if(d){const u=d.dataset.toggleThread;this.expandedThread=this.expandedThread===u?null:u,this.render();return}const m=i.target.closest("[data-action]");if(m){const u=m.dataset.action,_=m.dataset.threadId,T=m.dataset.sectionId;u==="pin"?this.handlePin(T,_):u==="lock"?this.handleLock(T,_):u==="delete-thread"&&this.handleDeleteThread(T,_);return}const l=i.target.closest('[id^="replyBtn_"]');if(l){const u=l.id.replace("replyBtn_","");this.handleReply(e.id,u)}})}async handleCreateThread(e){const t=this.container.querySelector(`#newThreadTitle_${e}`),n=this.container.querySelector(`#newThreadContent_${e}`),s=t.value.trim(),a=n.value.trim();if(!(!s||s.length<2)&&!(!a||a.length<1))try{const i=await p.create(this.frameId,e,s,a);this.section.threads.unshift(i.thread),this.render(),this.onUpdate()}catch(i){alert(i.message)}}async handleReply(e,t){const n=this.container.querySelector(`#replyInput_${t}`),s=n==null?void 0:n.value.trim();if(s)try{const a=await p.reply(this.frameId,e,t,s),i=this.section.threads.find(d=>d.id===t);i&&(i.replies||(i.replies=[]),i.replies.push(a.reply)),this.render(),this.onUpdate()}catch(a){alert(a.message)}}async handlePin(e,t){try{const n=await p.pin(this.frameId,e,t),s=this.section.threads.find(a=>a.id===t);s&&(s.pinned=n.pinned),this.render()}catch(n){alert(n.message)}}async handleLock(e,t){try{const n=await p.lock(this.frameId,e,t),s=this.section.threads.find(a=>a.id===t);s&&(s.locked=n.locked),this.render()}catch(n){alert(n.message)}}async handleDeleteThread(e,t){if(confirm("Delete this thread?"))try{await p.deleteThread(this.frameId,e,t);const n=this.section.threads.find(s=>s.id===t);n&&(n.deleted=!0),this.expandedThread=null,this.render(),this.onUpdate()}catch(n){alert(n.message)}}renderResources(e,t){const n=(e.resources||[]).filter(s=>!s.deleted);this.container.innerHTML=`
      <div class="frame-section frame-section--resources">
        <div class="frame-section__header">
          <h3>${o(e.title)}</h3>
          <span class="frame-section__count">${n.length} resource${n.length!==1?"s":""}</span>
        </div>
        ${t?`
          <div class="frame-section__composer resource-composer">
            <input type="text" class="form-input" id="resTitle_${e.id}" placeholder="Resource title" maxlength="150">
            <input type="url" class="form-input" id="resUrl_${e.id}" placeholder="https://...">
            <input type="text" class="form-input" id="resDesc_${e.id}" placeholder="Short description (optional)" maxlength="300">
            <button class="btn btn--primary btn--sm" id="addRes_${e.id}">Add Resource</button>
          </div>
        `:""}
        <div class="frame-section__list">
          ${n.length>0?n.map(s=>`
            <div class="resource-item">
              <a href="${o(s.url)}" target="_blank" rel="noopener" class="resource-item__link">
                <strong>${o(s.title)}</strong>
                ${s.description?`<p class="resource-item__desc">${o(s.description)}</p>`:""}
              </a>
              <div class="resource-item__meta">
                <span>by ${o(s.addedBy)}</span>
                <span>${$(s.addedAt)}</span>
                ${this.isCreator||t&&String(t.id)===String(s.addedById)?`<button class="btn btn--sm btn--danger" data-remove-resource="${s.id}" data-section-id="${e.id}">×</button>`:""}
              </div>
            </div>
          `).join(""):'<p class="text-dim text-sm">No resources yet. Share something useful.</p>'}
        </div>
      </div>
    `,this.bindResourceEvents(e)}bindResourceEvents(e){const t=this.container.querySelector(`#addRes_${e.id}`);t&&(t.onclick=()=>this.handleAddResource(e.id)),this.container.querySelectorAll("[data-remove-resource]").forEach(n=>{n.onclick=()=>this.handleRemoveResource(n.dataset.sectionId,n.dataset.removeResource)})}async handleAddResource(e){const t=this.container.querySelector(`#resTitle_${e}`).value.trim(),n=this.container.querySelector(`#resUrl_${e}`).value.trim(),s=this.container.querySelector(`#resDesc_${e}`).value.trim();if(!(!t||!n))try{const a=await y.addResource(this.frameId,e,t,n,s);this.section.resources||(this.section.resources=[]),this.section.resources.push(a.resource),this.render(),this.onUpdate()}catch(a){alert(a.message)}}async handleRemoveResource(e,t){var n;if(confirm("Remove this resource?"))try{await y.removeResource(this.frameId,e,t);const s=(n=this.section.resources)==null?void 0:n.find(a=>a.id===t);s&&(s.deleted=!0),this.render()}catch(s){alert(s.message)}}renderFaq(e,t){const n=(e.items||[]).filter(s=>!s.deleted);this.container.innerHTML=`
      <div class="frame-section frame-section--faq">
        <div class="frame-section__header">
          <h3>${o(e.title)}</h3>
          <span class="frame-section__count">${n.length} item${n.length!==1?"s":""}</span>
        </div>
        ${t?`
          <div class="frame-section__composer faq-composer">
            <input type="text" class="form-input" id="faqQ_${e.id}" placeholder="Question?" maxlength="300">
            <textarea class="form-input form-textarea" id="faqA_${e.id}" placeholder="Answer" rows="2" maxlength="3000"></textarea>
            <button class="btn btn--primary btn--sm" id="addFaq_${e.id}">Add FAQ</button>
          </div>
        `:""}
        <div class="frame-section__list">
          ${n.length>0?n.map(s=>`
            <details class="faq-item">
              <summary class="faq-item__question">
                <span>${o(s.question)}</span>
                ${this.isCreator||t&&String(t.id)===String(s.addedById)?`<button class="btn btn--sm btn--danger faq-remove" data-remove-faq="${s.id}" data-section-id="${e.id}">×</button>`:""}
              </summary>
              <div class="faq-item__answer">
                <p>${o(s.answer)}</p>
                <span class="faq-item__meta">by ${o(s.addedBy)} · ${$(s.addedAt)}</span>
              </div>
            </details>
          `).join(""):'<p class="text-dim text-sm">No FAQ items yet.</p>'}
        </div>
      </div>
    `,this.bindFaqEvents(e)}bindFaqEvents(e){const t=this.container.querySelector(`#addFaq_${e.id}`);t&&(t.onclick=()=>this.handleAddFaq(e.id)),this.container.querySelectorAll("[data-remove-faq]").forEach(n=>{n.onclick=s=>{s.stopPropagation(),this.handleRemoveFaq(n.dataset.sectionId,n.dataset.removeFaq)}})}async handleAddFaq(e){const t=this.container.querySelector(`#faqQ_${e}`).value.trim(),n=this.container.querySelector(`#faqA_${e}`).value.trim();if(!(!t||!n))try{const s=await y.addFaq(this.frameId,e,t,n);this.section.items||(this.section.items=[]),this.section.items.push(s.faq),this.render(),this.onUpdate()}catch(s){alert(s.message)}}async handleRemoveFaq(e,t){var n;if(confirm("Remove this FAQ item?"))try{await y.removeFaq(this.frameId,e,t);const s=(n=this.section.items)==null?void 0:n.find(a=>a.id===t);s&&(s.deleted=!0),this.render()}catch(s){alert(s.message)}}}const k=document.getElementById("userBadge"),b=document.getElementById("frameContent");let h=null,c=null,v=0;function L(){if(h=new URLSearchParams(window.location.search).get("id"),!h){b.innerHTML='<div class="frame-error">No frame ID specified. <a href="/pillars/knowledge/">Back to Knowledge Portal</a></div>';return}M(),S()}function M(){B(k)}async function S(){b.innerHTML='<div class="frame-loading">Loading frame...</div>';try{c=await x.get(h),document.title=`${c.id,""}Frame — Knowledge Portal — OpenWorld`,q()}catch(r){b.innerHTML=`<div class="frame-error">
      <p>Failed to load frame: ${g(r.message)}</p>
      <a href="/pillars/knowledge/">Back to Knowledge Portal</a>
    </div>`}}function q(){var i,d,m;const r=f.getUser(),e=r?String(r.id):null,t=(i=c.members)==null?void 0:i.some(l=>l.role==="creator"&&String(l.userId)===e),n=(d=c.members)==null?void 0:d.some(l=>String(l.userId)===e),s=(m=c.members)==null?void 0:m.find(l=>l.role==="creator"),a=c.sections||[];b.innerHTML=`
    <!-- Frame Header -->
    <header class="frame-header" id="frameHeader"></header>

    <!-- Section Tabs -->
    <nav class="sections-nav" id="sectionsNav"></nav>

    <!-- Section Content -->
    <div id="sectionContent"></div>

    <!-- Members -->
    <div class="frame-members" id="frameMembers"></div>

    <!-- Add Section (creator only) -->
    ${t?'<div id="addSectionArea"></div>':""}
  `,R(s,t,n),F(a),A(a,t),U(t,e),t&&H()}function R(r,e,t){var i,d,m,l;const n=document.getElementById("frameHeader"),s=f.getUser(),a=c.sections||[];n.innerHTML=`
    <div class="frame-header__top">
      <div class="frame-header__info">
        <h1 class="frame-header__title">${g(h)}</h1>
      </div>
    </div>
    <div class="frame-header__meta">
      ${r?`
        <span class="frame-header__meta-item">
          <img src="${r.avatar}" class="frame-header__creator-avatar">
          ${g(r.username)}
        </span>
      `:""}
      <span class="frame-header__meta-item">${((i=c.members)==null?void 0:i.length)||0} members</span>
      <span class="frame-header__meta-item">${a.length} sections</span>
    </div>
    ${s?`
      <div class="frame-actions">
        ${t?"":'<button class="btn btn--secondary btn--sm" id="joinBtn">Join Frame</button>'}
        ${t&&!e?'<button class="btn btn--outline btn--sm" id="leaveBtn">Leave</button>':""}
        ${e?'<button class="btn btn--outline btn--sm" id="archiveBtn">Archive</button>':""}
      </div>
    `:""}
  `,(d=document.getElementById("joinBtn"))==null||d.addEventListener("click",C),(m=document.getElementById("leaveBtn"))==null||m.addEventListener("click",D),(l=document.getElementById("archiveBtn"))==null||l.addEventListener("click",P)}function F(r){const e=document.getElementById("sectionsNav");if(r.length===0){e.innerHTML='<span class="text-dim text-sm">No sections</span>';return}e.innerHTML=r.map((t,n)=>`
    <button class="section-tab${n===v?" active":""}" data-section-idx="${n}">
      ${t.type==="discussion"?"💬":t.type==="resources"?"📎":"❓"} ${g(t.title)}
    </button>
  `).join(""),e.addEventListener("click",t=>{var s;const n=t.target.closest(".section-tab");n&&(v=parseInt(n.dataset.sectionIdx),e.querySelectorAll(".section-tab").forEach(a=>a.classList.remove("active")),n.classList.add("active"),A(r,(s=c.members)==null?void 0:s.some(a=>{var i;return a.role==="creator"&&String(a.userId)===String((i=f.getUser())==null?void 0:i.id)})))})}function A(r,e){const t=document.getElementById("sectionContent");if(r.length===0||v>=r.length){t.innerHTML='<p class="text-dim text-sm">No sections in this frame yet.</p>';return}t.innerHTML="";const n=r[v];new E(t,n,h,{isCreator:e,onUpdate:()=>{}})}function U(r,e){const t=document.getElementById("frameMembers"),n=c.members||[];t.innerHTML=`
    <h3>Members (${n.length})</h3>
    <div class="members-list">
      ${n.map(s=>`
        <div class="member-chip">
          <img src="${s.avatar}" class="member-chip__avatar">
          <span>${g(s.username)}</span>
          ${s.role==="creator"?'<span class="member-chip__role">creator</span>':""}
          ${r&&String(s.userId)!==e&&s.role!=="creator"?`<button class="btn btn--sm btn--danger" data-remove-member="${s.userId}" style="padding:0 4px;font-size:0.6rem;margin-left:2px;">×</button>`:""}
        </div>
      `).join("")}
    </div>
  `,t.querySelectorAll("[data-remove-member]").forEach(s=>{s.addEventListener("click",async()=>{const a=s.dataset.removeMember;if(confirm("Remove this member?"))try{await w.remove(h,a),c.members=c.members.filter(i=>String(i.userId)!==String(a)),q()}catch(i){alert(i.message)}})})}function H(){const r=document.getElementById("addSectionArea");r.innerHTML=`
    <div class="add-section-bar">
      <input type="text" class="form-input" id="newSectionTitle" placeholder="New section title..." maxlength="80">
      <select class="form-input" id="newSectionType" style="width: auto;">
        <option value="discussion">Discussion</option>
        <option value="resources">Resources</option>
        <option value="faq">FAQ</option>
      </select>
      <button class="btn btn--primary btn--sm" id="addSectionBtn">+ Add Section</button>
    </div>
  `,document.getElementById("addSectionBtn").addEventListener("click",j)}async function C(){try{await w.join(h),await S()}catch(r){alert(r.message)}}async function D(){if(confirm("Leave this frame?"))try{await w.leave(h),await S()}catch(r){alert(r.message)}}async function P(){if(confirm("Archive this frame? It will become inactive but can be adopted by someone else."))try{await x.archive(h),window.location.href="/pillars/knowledge/"}catch(r){alert(r.message)}}async function j(){const r=document.getElementById("newSectionTitle").value.trim(),e=document.getElementById("newSectionType").value;if(!(!r||r.length<2))try{const t=await I.add(h,r,e);c.sections.push(t.section),v=c.sections.length-1,q()}catch(t){alert(t.message)}}function g(r){if(!r)return"";const e=document.createElement("div");return e.textContent=r,e.innerHTML}L();

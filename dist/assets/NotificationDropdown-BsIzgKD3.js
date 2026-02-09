import{a as o,f as l}from"./auth-qTptiIUO.js";class d{constructor(){this.notifications=[],this.unreadCount=0,this.listeners=[],this.pollingInterval=null}startPolling(){this.pollingInterval||(this.fetchNotifications(),this.pollingInterval=setInterval(()=>{document.visibilityState==="visible"&&o.isLoggedIn()&&this.fetchNotifications()},6e4))}async fetchNotifications(){const t=o.getAccessToken();if(t)try{const e=await fetch("/.netlify/functions/get-notifications",{headers:{Authorization:`Bearer ${t}`}});if(!e.ok)return;this.notifications=await e.json(),this.updateUnreadCount(),this.notify()}catch(e){console.error("[Notifications] Fetch error:",e)}}async markAsRead(t=null){const e=o.getAccessToken();if(e){t?this.notifications.forEach(n=>{t.includes(n.id)&&(n.read=!0)}):this.notifications.forEach(n=>n.read=!0),this.updateUnreadCount(),this.notify();try{await fetch("/.netlify/functions/mark-read",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${e}`},body:JSON.stringify({notificationIds:t,markAll:!t})})}catch(n){console.error("[Notifications] Mark read error:",n)}}}updateUnreadCount(){this.unreadCount=this.notifications.filter(t=>!t.read).length}subscribe(t){return this.listeners.push(t),t(this.notifications,this.unreadCount),()=>{this.listeners=this.listeners.filter(e=>e!==t)}}notify(){this.listeners.forEach(t=>t(this.notifications,this.unreadCount))}}const r=new d;class u{constructor(t){this.container=t,this.externalBadge=document.getElementById("externalNotifBadge"),this.render(),this.bindEvents(),r.subscribe((e,n)=>{this.updateUI(e,n)}),r.startPolling()}render(){this.container.innerHTML=`
      <div class="notification-menu-wrapper">
        <button class="user-badge__dropdown-item notification-trigger-inline" id="notifBtn">
          <span class="flex items-center gap-2">
             🔔 Notifications
             <span class="notification-badge-inline" id="notifBadge" style="display: none;">0</span>
          </span>
        </button>
        
        <div class="notification-list-inline" id="notifList" style="display: none;">
          <div class="notification-header-inline">
            <button class="btn btn--text btn--xs" id="markReadBtn" style="font-size: 0.7rem; padding: 2px 6px;">Mark all read</button>
          </div>
          <div id="notifItems">
            <div class="text-dim" style="padding: var(--sp-2); text-align: center; font-size: 0.8rem;">No notifications</div>
          </div>
        </div>
      </div>
    `}bindEvents(){const t=this.container.querySelector("#notifBtn"),e=this.container.querySelector("#notifList"),n=this.container.querySelector("#markReadBtn");t.onclick=s=>{s.stopPropagation();const i=e.style.display==="none";e.style.display=i?"block":"none",t.classList.toggle("active",!i)},n.onclick=s=>{s.stopPropagation(),r.markAsRead()},e.onclick=s=>{s.stopPropagation();const i=s.target.closest(".notification-item-inline");if(!i||(i.dataset.id&&(r.markAsRead(i.dataset.id),i.classList.remove("unread")),s.target.closest(".notif-actor-link")))return;const a=i.dataset.url;a&&a!=="#"&&(window.location.href=a)}}updateUI(t,e){const n=this.container.querySelector("#notifBadge"),s=this.container.querySelector("#notifItems");if(e>0?(n.textContent=e>9?"9+":e,n.style.display="inline-flex"):n.style.display="none",this.externalBadge&&(e>0?(this.externalBadge.textContent=e>9?"9+":e,this.externalBadge.style.display="inline-flex"):this.externalBadge.style.display="none"),t.length===0){s.innerHTML='<div class="text-dim" style="padding: var(--sp-2); text-align: center; font-size: 0.8rem;">No notifications</div>';return}s.innerHTML=t.map(i=>`
      <div class="notification-item-inline ${i.read?"":"unread"}" data-id="${i.id}" data-url="${this.getUrl(i)}" style="cursor: pointer;">
        <div class="notification-icon-inline">
          ${this.getIcon(i.type)}
        </div>
        <div class="notification-content">
          <p class="notification-text">
            <strong><a href="/pillars/community/profile.html?user=${i.actor.username}" class="notif-actor-link">@${i.actor.username}</a></strong> ${this.getText(i)}
          </p>
          <span class="notification-time">${l(i.createdAt)}</span>
        </div>
      </div>
    `).join("")}getIcon(t){switch(t){case"follow":return"👤";case"star":return"⭐";case"reaction":return"❤️";case"reply":return"💬";default:return"bell"}}getText(t){switch(t.type){case"follow":return"started following you";case"star":return`starred <strong>${t.data.repoName}</strong>`;case"reaction":return"reacted to your post";case"reply":return"replied to your post";default:return"interacted with you"}}getUrl(t){switch(t.type){case"follow":return`/pillars/community/profile.html?user=${t.actor.username}`;case"star":return`https://github.com/${t.data.repoName}`;case"reaction":case"reply":return`/pillars/community/?post=${t.data.postId}`;default:return"#"}}}export{u as N};

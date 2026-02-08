import{a as o,f as c}from"./auth-CDsf9gWV.js";class l{constructor(){this.notifications=[],this.unreadCount=0,this.listeners=[],this.pollingInterval=null}startPolling(){this.pollingInterval||(this.fetchNotifications(),this.pollingInterval=setInterval(()=>{document.visibilityState==="visible"&&o.isLoggedIn()&&this.fetchNotifications()},6e4))}async fetchNotifications(){const t=o.getAccessToken();if(t)try{const i=await fetch("/.netlify/functions/get-notifications",{headers:{Authorization:`Bearer ${t}`}});if(!i.ok)return;this.notifications=await i.json(),this.updateUnreadCount(),this.notify()}catch(i){console.error("[Notifications] Fetch error:",i)}}async markAsRead(t=null){const i=o.getAccessToken();if(i){t?this.notifications.forEach(e=>{t.includes(e.id)&&(e.read=!0)}):this.notifications.forEach(e=>e.read=!0),this.updateUnreadCount(),this.notify();try{await fetch("/.netlify/functions/mark-read",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${i}`},body:JSON.stringify({notificationIds:t,markAll:!t})})}catch(e){console.error("[Notifications] Mark read error:",e)}}}updateUnreadCount(){this.unreadCount=this.notifications.filter(t=>!t.read).length}subscribe(t){return this.listeners.push(t),t(this.notifications,this.unreadCount),()=>{this.listeners=this.listeners.filter(i=>i!==t)}}notify(){this.listeners.forEach(t=>t(this.notifications,this.unreadCount))}}const r=new l;class f{constructor(t){this.container=t,this.render(),this.bindEvents(),r.subscribe((i,e)=>{this.updateUI(i,e)}),r.startPolling()}render(){this.container.innerHTML=`
      <div class="notification-menu-wrapper">
        <button class="user-badge__dropdown-item notification-trigger-inline" id="notifBtn">
          <span class="flex items-center gap-2">
             🔔 Notifications
             <span class="notification-badge-inline" id="notifBadge" style="display: none;">0</span>
          </span>
        </button>
        
        <div class="notification-list-inline" id="notifList" style="display: none;">
          <div class="notification-header-inline">
            <button class="btn btn--text btn--xs" id="markReadBtn">Mark all read</button>
          </div>
          <div id="notifItems">
            <div class="text-dim" style="padding: var(--sp-2); text-align: center; font-size: 0.8rem;">No notifications</div>
          </div>
        </div>
      </div>
    `}bindEvents(){const t=this.container.querySelector("#notifBtn"),i=this.container.querySelector("#notifList"),e=this.container.querySelector("#markReadBtn");t.onclick=n=>{n.stopPropagation();const s=i.style.display==="none";i.style.display=s?"block":"none",t.classList.toggle("active",!s)},e.onclick=n=>{n.stopPropagation(),r.markAsRead()},i.onclick=n=>n.stopPropagation()}updateUI(t,i){const e=this.container.querySelector("#notifBadge"),n=this.container.querySelector("#notifItems");if(i>0?(e.textContent=i>9?"9+":i,e.style.display="inline-flex"):e.style.display="none",t.length===0){n.innerHTML='<div class="text-dim" style="padding: var(--sp-2); text-align: center; font-size: 0.8rem;">No notifications</div>';return}n.innerHTML=t.map(s=>`
      <div class="notification-item-inline ${s.read?"":"unread"}">
        <div class="notification-icon-inline">
          ${this.getIcon(s.type)}
        </div>
        <div class="notification-content">
          <p class="notification-text">
            <strong>@${s.actor.username}</strong> ${this.getText(s)}
          </p>
          <span class="notification-time">${c(s.createdAt)}</span>
        </div>
      </div>
    `).join("")}getIcon(t){switch(t){case"follow":return"👤";case"star":return"⭐";case"reaction":return"❤️";case"reply":return"💬";default:return"bell"}}getText(t){switch(t.type){case"follow":return"started following you";case"star":return`starred <strong>${t.data.repoName}</strong>`;case"reaction":return"reacted to your post";case"reply":return"replied to your post";default:return"interacted with you"}}}export{f as N};

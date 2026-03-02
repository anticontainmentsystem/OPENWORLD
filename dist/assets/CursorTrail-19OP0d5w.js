const l=["#b87333","#c4885c","#4a6741","#6b8b61"];let i=!1,o=[],a=null;function c(e,n){const t=document.createElement("span");return t.textContent="◈",t.style.cssText=`
    position: fixed;
    left: ${e}px;
    top: ${n}px;
    pointer-events: none;
    z-index: 99999;
    font-size: ${8+Math.random()*14}px;
    color: ${l[Math.floor(Math.random()*l.length)]};
    opacity: 1;
    transform: translate(-50%, -50%);
    transition: none;
  `,document.body.appendChild(t),{el:t,x:e,y:n,life:1,decay:.005+Math.random()*.008,drift:(Math.random()-.5)*4,fall:.5+Math.random()*2}}function r(){o.forEach((e,n)=>{e.life-=e.decay,e.x+=e.drift,e.y+=e.fall;const t=.5+Math.sin(Date.now()*.01+n)*.5;e.el.style.opacity=e.life*t,e.el.style.left=e.x+"px",e.el.style.top=e.y+"px",e.life<=0&&e.el.remove()}),o=o.filter(e=>e.life>0),o.length>0||i?a=requestAnimationFrame(r):a=null}function d(e){if(!i)return;const n=Math.random()>.5?2:1;for(let t=0;t<n;t++){const f=(Math.random()-.5)*20,s=(Math.random()-.5)*20;o.push(c(e.clientX+f,e.clientY+s))}a||(a=requestAnimationFrame(r))}function m(e){e.key==="Shift"&&!i&&(i=!0)}function u(e){e.key==="Shift"&&(i=!1)}function h(){document.addEventListener("mousemove",d),document.addEventListener("keydown",m),document.addEventListener("keyup",u)}export{h as i};

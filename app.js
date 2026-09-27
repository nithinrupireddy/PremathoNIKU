(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Preloader
  addEventListener('load', () => setTimeout(() => document.getElementById('preloader')?.classList.add('hide'), 450));

  // Ambient stars
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let W=0,H=0,DPR=Math.min(devicePixelRatio||1,2),stars=[];
  function resizeStars(){
    W=innerWidth;H=innerHeight;
    canvas.width=W*DPR; canvas.height=H*DPR; canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    stars=Array.from({length:Math.min(150,Math.floor(W*H/4800))},()=>({
      x:Math.random()*W,y:Math.random()*H,r:.25+Math.random()*1.1,a:.15+Math.random()*.48,t:Math.random()*Math.PI*2
    }));
  }
  function drawStars(ms){
    ctx.clearRect(0,0,W,H);
    const t=ms/1500;
    stars.forEach(s=>{
      const a=reduce?s.a:s.a*(.72+.28*Math.sin(t+s.t));
      ctx.beginPath();ctx.fillStyle=`rgba(255,239,205,${a})`;ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }
  resizeStars(); addEventListener('resize',resizeStars); requestAnimationFrame(drawStars);

  // Full menu
  const menu=document.getElementById('siteMenu'), menuBtn=document.getElementById('menuBtn'), close=document.getElementById('menuClose');
  function openMenu(){menu.classList.add('open');menu.setAttribute('aria-hidden','false');menuBtn.setAttribute('aria-expanded','true');document.body.classList.add('locked')}
  function closeMenu(){menu.classList.remove('open');menu.setAttribute('aria-hidden','true');menuBtn.setAttribute('aria-expanded','false');document.body.classList.remove('locked')}
  menuBtn.addEventListener('click',openMenu); close.addEventListener('click',closeMenu);
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));

  // Smooth scroll & motion
  if(!reduce && window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    if(window.Lenis){
      const lenis=new Lenis({duration:1.08,smoothWheel:true});
      lenis.on('scroll',ScrollTrigger.update);
      gsap.ticker.add(t=>lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0);
    }

    gsap.utils.toArray('.reveal').forEach(el=>{
      gsap.fromTo(el,{autoAlpha:0,y:34},{autoAlpha:1,y:0,duration:.95,ease:'power3.out',
        scrollTrigger:{trigger:el,start:'top 82%',once:true}});
    });
    gsap.utils.toArray('.image-bg').forEach(bg=>{
      gsap.fromTo(bg,{scale:1.08,yPercent:-2},{scale:1.02,yPercent:4,ease:'none',
        scrollTrigger:{trigger:bg.parentElement,start:'top bottom',end:'bottom top',scrub:true}});
    });
    gsap.to('.date-title strong',{y:-14,scale:1.035,ease:'none',scrollTrigger:{trigger:'#date',start:'top 65%',end:'bottom 35%',scrub:true}});
    gsap.to('.city-light-line',{xPercent:22,ease:'none',scrollTrigger:{trigger:'#city',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.to('.o1',{rotation:26,ease:'none',scrollTrigger:{trigger:'#countdown',start:'top bottom',end:'bottom top',scrub:true}});
    gsap.to('.o2',{rotation:-44,ease:'none',scrollTrigger:{trigger:'#countdown',start:'top bottom',end:'bottom top',scrub:true}});
  } else {
    document.querySelectorAll('.reveal').forEach(el=>{el.style.opacity='1';el.style.transform='none'});
  }

  // Progress rail
  const sections=[...document.querySelectorAll('main > section')], rail=[...document.querySelectorAll('.progress-rail span')];
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const idx=Number(e.target.dataset.index||0);
        rail.forEach((r,i)=>r.classList.toggle('active',i===idx));
      }
    })
  },{threshold:.52});
  sections.forEach(s=>obs.observe(s));

  // Countdown: Charlotte on Jan 9 is EST (-05:00)
  const target=new Date('2027-01-09T19:00:00-05:00').getTime();
  function tick(){
    let diff=Math.max(0,target-Date.now());
    const d=Math.floor(diff/86400000); diff%=86400000;
    const h=Math.floor(diff/3600000); diff%=3600000;
    const m=Math.floor(diff/60000); const s=Math.floor((diff%60000)/1000);
    days.textContent=String(d).padStart(3,'0');
    hours.textContent=String(h).padStart(2,'0');
    minutes.textContent=String(m).padStart(2,'0');
    seconds.textContent=String(s).padStart(2,'0');
  }
  tick();setInterval(tick,1000);

  // RSVP progressive flow
  const state={adults:1,children:0};
  const steps=[...document.querySelectorAll('.step')];
  const bars=[...document.querySelectorAll('.rsvp-progress i')];
  const order={attendance:0,name:1,party:2,contact:3,review:4,decline:4,confirmed:4};
  function show(name){
    steps.forEach(s=>s.classList.toggle('active',s.dataset.step===name));
    bars.forEach((b,i)=>b.classList.toggle('on',i<=order[name]));
    const active=document.querySelector('.step.active');
    if(active && window.gsap && !reduce) gsap.fromTo(active,{opacity:0,y:16},{opacity:1,y:0,duration:.4,ease:'power2.out'});
  }
  document.querySelectorAll('[data-attend]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.attend==='yes'?'name':'decline')));
  document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.back)));
  document.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.dataset.count,dir=Number(b.dataset.dir),min=k==='adults'?1:0;
    state[k]=Math.max(min,Math.min(20,state[k]+dir));
    document.getElementById(k).textContent=state[k];
  }));

  function validateName(){
    const ok=guestName.value.trim().length>=2;
    nameError.textContent=ok?'':'Please enter your name.';
    return ok;
  }
  function validateContact(){
    const p=/^[0-9+()\-\s]{7,20}$/.test(phone.value.trim());
    const e=email.checkValidity() && email.value.trim().length>3;
    contactError.textContent=(p&&e)?'':'Please enter a valid phone number and email address.';
    return p&&e;
  }
  document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>{
    const cur=b.closest('.step').dataset.step;
    if(cur==='name'&&!validateName())return;
    if(cur==='contact'&&!validateContact())return;
    if(b.dataset.next==='review'){
      reviewCard.innerHTML=`
        <div><span>Name</span><strong>${escapeHTML(guestName.value.trim())}</strong></div>
        <div><span>Guests</span><strong>${state.adults} adult${state.adults===1?'':'s'} · ${state.children} child${state.children===1?'':'ren'}</strong></div>
        <div><span>Phone</span><strong>${escapeHTML(phone.value.trim())}</strong></div>
        <div><span>Email</span><strong>${escapeHTML(email.value.trim())}</strong></div>`;
    }
    show(b.dataset.next);
  }));
  function escapeHTML(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

  // Visual-final build: save locally for now. Google Sheets endpoint can be added after design approval.
  const form=document.getElementById('rsvpForm');
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const payload={
      attending:true,name:guestName.value.trim(),adults:state.adults,children:state.children,
      phone:phone.value.trim(),email:email.value.trim(),updatedAt:new Date().toISOString()
    };
    localStorage.setItem('premathoniku-rsvp',JSON.stringify(payload));
    show('confirmed');
  });
  document.getElementById('editRsvp').addEventListener('click',()=>show('name'));

  // restore same-device draft
  try{
    const saved=JSON.parse(localStorage.getItem('premathoniku-rsvp')||'null');
    if(saved){
      guestName.value=saved.name||'';phone.value=saved.phone||'';email.value=saved.email||'';
      state.adults=saved.adults||1;state.children=saved.children||0;
      adults.textContent=state.adults;children.textContent=state.children;
    }
  }catch(e){}
})();

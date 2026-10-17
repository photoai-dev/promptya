document.querySelectorAll('.home-video-band').forEach(band=>{
 const video=band.querySelector('video'),button=band.querySelector('button'),motion=matchMedia("(prefers-reduced-motion: reduce)");
 let visible=false,manualPause=false,loaded=false;
 function load(){if(loaded)return;loaded=true;for(const source of video.querySelectorAll('source[data-src]'))source.src=source.dataset.src;video.muted=true;video.defaultMuted=true;video.load();}
 function label(){button.textContent=video.paused?"Play the animation":'Pause';button.setAttribute('aria-label',video.paused?"Play background animation":"Pause background animation");}
 async function play(){load();try{await video.play();}catch{}label();}
 function sync(){if(visible&&!document.hidden&&!manualPause&&!motion.matches)play();else{video.pause();label();}}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.15;sync();},{threshold:[0,.15,.5]});observer.observe(band);
 button.addEventListener('click',()=>{if(video.paused){manualPause=false;play();}else{manualPause=true;video.pause();label();}});
 video.addEventListener('play',label);video.addEventListener('pause',label);document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);label();
});

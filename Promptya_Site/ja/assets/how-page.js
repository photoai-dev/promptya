const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('how-reveal');observer.unobserve(entry.target);}}},{threshold:.12});
document.querySelectorAll('.how-step,.how-reference-copy,.how-format-grid article,.how-download-art').forEach(element=>observer.observe(element));

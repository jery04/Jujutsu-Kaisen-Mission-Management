(function(){
  function formatLocal(dateStr){
    try { const d = new Date(dateStr); return d.toLocaleString(); } catch(_) { return String(dateStr||''); }
  }
  async function refreshVirtualTime(){
    try {
      const res = await fetch('/admin/time');
      const data = await res.json();
      if (data && data.ok && data.now) {
        const txt = formatLocal(data.now);
        document.querySelectorAll('[data-virtual-time], #virtual-time-label').forEach(function(el){
          el.textContent = txt;
        });
      }
    } catch(_) {}
  }
  // Expose and auto-run on DOM ready
  window.refreshVirtualTime = refreshVirtualTime;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshVirtualTime, { once: true });
  } else {
    refreshVirtualTime();
  }
})();

(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/[&<>\"]+/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Maneja el botón de exportar PDF: abre una ventana con versión imprimible
  document.addEventListener('DOMContentLoaded', function () {
    const exportBtn = document.getElementById('export-pdf');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', function () {
      try {
        const container = document.getElementById('results');
        if (!container) { alert('No hay resultados para exportar.'); return; }
        const items = Array.from(container.querySelectorAll('.query-item')).filter(it => !it.classList.contains('pagination-controls'));
        if (!items.length) { alert('No hay resultados para exportar.'); return; }

        (function printResults() {
          const w = window.open('', '_blank');
          if (!w) { alert('No se pudo abrir una ventana para imprimir. Comprueba el bloqueador de ventanas emergentes.'); return; }
          const cssHref = '/css/query.css';
          const htmlParts = [];
          htmlParts.push('<!doctype html><html><head><meta charset="utf-8"><title>Resultados</title>');
          htmlParts.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
          htmlParts.push('<link rel="stylesheet" href="' + cssHref + '">');
          htmlParts.push('<style>body{font-family:Arial,Helvetica,sans-serif;padding:18px} .query-item{margin-bottom:12px} h3{margin:0 0 4px 0}</style>');
          htmlParts.push('</head><body>');
          items.forEach(it => {
            const title = it.querySelector('h3') ? it.querySelector('h3').textContent : '';
            htmlParts.push('<div class="query-item">');
            if (title) htmlParts.push('<h3>' + escapeHtml(title) + '</h3>');
            const p = it.querySelector('p');
            if (p) {
              htmlParts.push('<div>');
              Array.from(p.querySelectorAll('div')).forEach(d => { htmlParts.push('<div>' + escapeHtml((d.textContent || '').trim()) + '</div>'); });
              htmlParts.push('</div>');
            }
            htmlParts.push('</div>');
          });
          htmlParts.push('</body></html>');
          const html = htmlParts.join('');
          w.document.open();
          w.document.write(html);
          w.document.close();
          w.focus();
          setTimeout(() => { try { w.print(); } catch (e) { alert('Error al imprimir: ' + e.message); } }, 500);
        })();

      } catch (err) {
        console.error('Export PDF error', err);
        alert('Ocurrió un error al exportar: ' + (err && err.message ? err.message : String(err)));
      }
    });
  });
})();

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

    // Helper that performs export given items and a selected format
    function performExport(items, format) {
      try {
        // Build the inner body using the exporters helper (keeps formatting consistent)
        var body = (window.Exporters && window.Exporters.buildBodyFromItems)
          ? window.Exporters.buildBodyFromItems(items)
          : (function () {
              const parts = [];
              items.forEach(it => {
                const title = it.querySelector('h3') ? it.querySelector('h3').textContent : '';
                parts.push('<div class="query-item">');
                if (title) parts.push('<h3>' + escapeHtml(title) + '</h3>');
                const p = it.querySelector('p');
                if (p) {
                  parts.push('<div>');
                  Array.from(p.querySelectorAll('div')).forEach(d => { parts.push('<div>' + escapeHtml((d.textContent || '').trim()) + '</div>'); });
                  parts.push('</div>');
                }
                parts.push('</div>');
              });
              return parts.join('');
            })();

        // Helper to trigger a download of a string as a file
        function downloadString(filename, content, mime) {
          var blob = new Blob([content], { type: mime || 'application/octet-stream' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
        }

        if (format === 'pdf') {
          // Build printable HTML and open in new window for print
          var exported = null;
          if (window.Exporters && window.Exporters.Documento && window.Exporters.ExportarPDF) {
            var doc = new window.Exporters.Documento(body);
            exported = new window.Exporters.ExportarPDF(doc, { cssHref: '/css/query.css' }).contenido();
          } else {
            var htmlParts = [];
            htmlParts.push('<!doctype html><html><head><meta charset="utf-8"><title>Resultados</title>');
            htmlParts.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
            htmlParts.push('<link rel="stylesheet" href="' + '/css/query.css' + '">');
            htmlParts.push('<style>body{font-family:Arial,Helvetica,sans-serif;padding:18px} .query-item{margin-bottom:12px} h3{margin:0 0 4px 0}</style>');
            htmlParts.push('</head><body>');
            htmlParts.push(body);
            htmlParts.push('</body></html>');
            exported = htmlParts.join('');
          }

          const w = window.open('', '_blank');
          if (!w) { alert('No se pudo abrir una ventana para imprimir. Comprueba el bloqueador de ventanas emergentes.'); return; }
          w.document.open();
          w.document.write(exported);
          w.document.close();
          w.focus();
          setTimeout(() => { try { w.print(); } catch (e) { alert('Error al imprimir: ' + e.message); } }, 500);

        } else if (format === 'latex') {
          // Build LaTeX content and download as .tex
          if (window.Exporters && window.Exporters.Documento && window.Exporters.ExportarLaTeX) {
            var docTex = new window.Exporters.Documento(body);
            var tex = new window.Exporters.ExportarLaTeX(docTex).contenido();
            downloadString('result.tex', tex, 'text/plain;charset=utf-8');
          } else {
            downloadString('result.tex', body, 'text/plain;charset=utf-8');
          }

        } else if (format === 'docx') {
          // Build DOCX (placeholder) and download as .docx
          if (window.Exporters && window.Exporters.Documento && window.Exporters.ExportarDOCX) {
            var docDocx = new window.Exporters.Documento(body);
            var docxContent = new window.Exporters.ExportarDOCX(docDocx).contenido();
            downloadString('result.docx', docxContent, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8');
          } else {
            downloadString('result.docx', body, 'text/plain;charset=utf-8');
          }

        } else if (format === 'csv') {
          // Build CSV and download
          if (window.Exporters && window.Exporters.buildCSVFromItems) {
            var csv = window.Exporters.buildCSVFromItems(items);
            downloadString('result.csv', csv, 'text/csv;charset=utf-8');
          } else if (window.Exporters && window.Exporters.Documento && window.Exporters.ExportarCSV) {
            var csvDoc = new window.Exporters.Documento('');
            var csvContent = new window.Exporters.ExportarCSV(csvDoc).contenido();
            downloadString('result.csv', csvContent, 'text/csv;charset=utf-8');
          } else {
            // Fallback: naive CSV from titles and text
            var rows = ['"Título","Contenido"'];
            items.forEach(it => {
              var title = it.querySelector('h3') ? it.querySelector('h3').textContent.replace(/"/g, '""') : '';
              var p = it.querySelector('p');
              var content = '';
              if (p) content = Array.from(p.querySelectorAll('div')).map(d => (d.textContent || '').trim().replace(/"/g, '""')).join(' | ');
              rows.push('"' + title + '","' + content + '"');
            });
            downloadString('result.csv', rows.join('\n'), 'text/csv;charset=utf-8');
          }

        } else {
          alert('Formato de exportación desconocido: ' + format);
        }
      } catch (err) {
        console.error('Export error', err);
        alert('Ocurrió un error al exportar: ' + (err && err.message ? err.message : String(err)));
      }
    }

    // On export button click: gather items and show modal to choose format
    exportBtn.addEventListener('click', function () {
      const container = document.getElementById('results');
      if (!container) { alert('No hay resultados para exportar.'); return; }
      const items = Array.from(container.querySelectorAll('.query-item')).filter(it => !it.classList.contains('pagination-controls'));
      if (!items.length) { alert('No hay resultados para exportar.'); return; }

      var modal = document.getElementById('export-modal');
      if (!modal) {
        // If modal not present, fallback to immediate PDF export
        performExport(items, 'pdf');
        return;
      }

      // Show modal (no inline display; use aria-hidden and body lock)
      function showModal(modalEl, itemsRef) {
        modalEl._items = itemsRef;
        modalEl.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        // focus first option for accessibility
        const first = modalEl.querySelector('[data-format]');
        if (first) first.focus();
      }

      function hideModal(modalEl) {
        modalEl.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // restore focus to export button
        try { exportBtn.focus(); } catch (e) {}
      }

      // Initialize modal buttons once
      if (!modal._initialized) {
        modal._initialized = true;
        modal.querySelectorAll('[data-format]').forEach(btn => {
          btn.addEventListener('click', function (ev) {
            var fmt = btn.getAttribute('data-format') || 'pdf';
            var its = modal._items || [];
            hideModal(modal);
            performExport(its, fmt);
          });
        });
        var cancel = document.getElementById('export-cancel');
        if (cancel) cancel.addEventListener('click', function () { hideModal(modal); });

        // Close when clicking on backdrop (outside dialog)
        modal.addEventListener('click', function (ev) {
          if (ev.target === modal) hideModal(modal);
        });

        // Close on Escape
        document.addEventListener('keydown', function (ev) {
          if (ev.key === 'Escape' || ev.key === 'Esc') {
            if (modal.getAttribute('aria-hidden') === 'false') hideModal(modal);
          }
        });
      }

      showModal(modal, items);
    });
  });
})();

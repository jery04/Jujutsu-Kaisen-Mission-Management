(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]+/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Componente base: representa el contenido a exportar (ya formateado en HTML o texto)
  class Documento {
    constructor(content) {
      this._content = content || '';
    }

    contenido() {
      return this._content;
    }
  }

  // Decorador base
  class ExportadorDecorator extends Documento {
    constructor(documento) {
      super();
      this._documento = documento;
    }

    contenido() {
      return this._documento.contenido();
    }
  }

  // Exportador PDF: envuelve el contenido en una página HTML imprimible
  class ExportarPDF extends ExportadorDecorator {
    constructor(documento, options) {
      super(documento);
      this._options = options || {};
    }

    contenido() {
      const cssHref = this._options.cssHref || '/css/query.css';
      const body = this._documento.contenido();
      const htmlParts = [];
      htmlParts.push('<!doctype html><html><head><meta charset="utf-8"><title>Resultados</title>');
      htmlParts.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
      htmlParts.push('<link rel="stylesheet" href="' + cssHref + '">');
      htmlParts.push('<style>body{font-family:Arial,Helvetica,sans-serif;padding:18px} .query-item{margin-bottom:12px} h3{margin:0 0 4px 0}</style>');
      htmlParts.push('</head><body>');
      htmlParts.push(body);
      htmlParts.push('</body></html>');
      return htmlParts.join('');
    }
  }

  // Exportador LaTeX: envuelve el contenido en un documento LaTeX básico
  class ExportarLaTeX extends ExportadorDecorator {
    contenido() {
      const raw = this._documento.contenido();
      // Convertir etiquetas HTML básicas a texto LaTeX simple
      const text = raw
        .replace(/<h3>(.*?)<\/h3>/g, function (_, t) { return '\\section*{' + t + '}\n'; })
        .replace(/<div class="query-item">/g, '')
        .replace(/<div>/g, '')
        .replace(/<\/div>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');

      return 'LaTeX:\\n\\begin{document}\\n' + text + '\\n\\end{document}';
    }
  }

  // Exportador DOCX (placeholder simple): prefiere etiqueta y texto plano
  class ExportarDOCX extends ExportadorDecorator {
    contenido() {
      const raw = this._documento.contenido();
      const text = raw.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
      return 'DOCX:\n[Word Document]\n' + text;
    }
  }

  // Exportador CSV: recibe un documento cuyo contenido es CSV plano
  class ExportarCSV extends ExportadorDecorator {
    contenido() {
      // Asume que el documento ya tiene contenido CSV o texto plano
      return this._documento.contenido();
    }
  }

  // Helper para construir el contenido interno a partir de elementos DOM (lista de nodes)
  function buildBodyFromItems(items) {
    const parts = [];
    items.forEach(it => {
      const titleEl = it.querySelector('h3');
      parts.push('<div class="query-item">');
      if (titleEl) parts.push('<h3>' + escapeHtml(titleEl.textContent || '') + '</h3>');
      const p = it.querySelector('p');
      if (p) {
        parts.push('<div>');
        Array.from(p.querySelectorAll('div')).forEach(d => { parts.push('<div>' + escapeHtml((d.textContent || '').trim()) + '</div>'); });
        parts.push('</div>');
      }
      parts.push('</div>');
    });
    return parts.join('');
  }

  // Helper para construir CSV desde items DOM
  function buildCSVFromItems(items) {
    // Cabeceras básicas: Título, Contenido
    const rows = [];
    rows.push(['Título', 'Contenido']);
    items.forEach(it => {
      const titleEl = it.querySelector('h3');
      const title = titleEl ? (titleEl.textContent || '') : '';
      const p = it.querySelector('p');
      let content = '';
      if (p) {
        const parts = Array.from(p.querySelectorAll('div')).map(d => (d.textContent || '').trim());
        content = parts.join(' | ');
      }
      // Escape double quotes for CSV
      const safeTitle = '"' + String(title).replace(/"/g, '""') + '"';
      const safeContent = '"' + String(content).replace(/"/g, '""') + '"';
      rows.push([safeTitle, safeContent]);
    });
    return rows.map(r => r.join(',')).join('\n');
  }

  // Exponer la API globalmente
  window.Exporters = {
    Documento: Documento,
    ExportadorDecorator: ExportadorDecorator,
    ExportarPDF: ExportarPDF,
    ExportarLaTeX: ExportarLaTeX,
    ExportarDOCX: ExportarDOCX,
    ExportarCSV: ExportarCSV,
    buildBodyFromItems: buildBodyFromItems
    , buildCSVFromItems: buildCSVFromItems
  };

})();

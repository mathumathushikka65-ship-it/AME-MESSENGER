import { useCallback, useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import html2pdf from 'html2pdf.js';
import './Documentcreation.css';
import API_URL from '../../services/api';

/* API */
const BASE = `${API_URL}/documents`;

const request = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('ameToken')}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed: ${res.status}`);
  }

  return res.status === 204 ? null : res.json();
};

const listDocuments = () => request(BASE);
const getDocument = (id) => request(`${BASE}/${id}`);
const createDocument = (data = {}) => request(BASE, { method: 'POST', body: JSON.stringify(data) });
const updateDocument = (id, data) => request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
const deleteDocument = (id) => request(`${BASE}/${id}`, { method: 'DELETE' });

const AUTOSAVE_DELAY = 900;
const FONT_SIZES = [
  { label: '10', value: '1' },
  { label: '12', value: '2' },
  { label: '14', value: '3' },
  { label: '16', value: '4' },
  { label: '18', value: '5' },
  { label: '24', value: '6' },
  { label: '32', value: '7' },
];

const ToolbarButton = ({ children, title, onFormat, command, value, onClick, active = false }) => (
  <button
    type="button"
    className={`dc-tool-btn${active ? ' is-active' : ''}`}
    title={title}
    aria-label={title}
    onMouseDown={(event) => {
      // Keep the selection in the editable page while toolbar controls are used.
      event.preventDefault();
      if (onFormat) onFormat(command, value);
      else onClick?.();
    }}
  >
    {children}
  </button>
);

const Toolbar = ({
  onFormat,
  onLink,
  onInsertTable,
  onInsertImage,
  onPrint,
  onDownloadHtml,
  fontFamily,
  onFontFamilyChange,
  fontSize,
  onFontSizeChange,
}) => (
  <div className="dc-toolbar-wrap">
    <div className="dc-toolbar" role="toolbar" aria-label="Document formatting">
      <div className="dc-tool-group">
        <select
          className="dc-tool-select dc-font-family"
          aria-label="Font family"
          value={fontFamily}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => onFontFamilyChange(event.target.value)}
        >
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="'Times New Roman'">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="Tahoma">Tahoma</option>
          <option value="'Courier New'">Courier New</option>
        </select>
        <select
          className="dc-tool-select dc-font-size"
          aria-label="Font size"
          value={fontSize}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => onFontSizeChange(event.target.value)}
        >
          {FONT_SIZES.map((size) => <option key={size.value} value={size.value}>{size.label}</option>)}
        </select>
      </div>

      <div className="dc-tool-group">
        <ToolbarButton title="Bold" onFormat={onFormat} command="bold"><b>B</b></ToolbarButton>
        <ToolbarButton title="Italic" onFormat={onFormat} command="italic"><i>I</i></ToolbarButton>
        <ToolbarButton title="Underline" onFormat={onFormat} command="underline"><u>U</u></ToolbarButton>
        <ToolbarButton title="Strikethrough" onFormat={onFormat} command="strikeThrough"><s>S</s></ToolbarButton>
        <label className="dc-color-control" title="Text color">
          <span>A</span>
          <input aria-label="Text color" type="color" defaultValue="#202124" onChange={(event) => onFormat('foreColor', event.target.value)} />
        </label>
        <label className="dc-color-control dc-highlight-control" title="Highlight color">
          <span>▰</span>
          <input aria-label="Highlight color" type="color" defaultValue="#fff2a8" onChange={(event) => onFormat('hiliteColor', event.target.value)} />
        </label>
      </div>

      <div className="dc-tool-group">
        <ToolbarButton title="Heading 1" onFormat={onFormat} command="formatBlock" value="h1">H1</ToolbarButton>
        <ToolbarButton title="Heading 2" onFormat={onFormat} command="formatBlock" value="h2">H2</ToolbarButton>
        <ToolbarButton title="Normal text" onFormat={onFormat} command="formatBlock" value="p">¶</ToolbarButton>
        <ToolbarButton title="Bulleted list" onFormat={onFormat} command="insertUnorderedList">• List</ToolbarButton>
        <ToolbarButton title="Numbered list" onFormat={onFormat} command="insertOrderedList">1. List</ToolbarButton>
      </div>

      <div className="dc-tool-group">
        <ToolbarButton title="Align left" onFormat={onFormat} command="justifyLeft">⇤</ToolbarButton>
        <ToolbarButton title="Align center" onFormat={onFormat} command="justifyCenter">≡</ToolbarButton>
        <ToolbarButton title="Align right" onFormat={onFormat} command="justifyRight">⇥</ToolbarButton>
        <ToolbarButton title="Justify" onFormat={onFormat} command="justifyFull">☰</ToolbarButton>
        <ToolbarButton title="Decrease indent" onFormat={onFormat} command="outdent">⇤−</ToolbarButton>
        <ToolbarButton title="Increase indent" onFormat={onFormat} command="indent">⇥+</ToolbarButton>
      </div>

      <div className="dc-tool-group">
        <ToolbarButton title="Insert link" onClick={onLink}>↗ Link</ToolbarButton>
        <ToolbarButton title="Insert table" onClick={onInsertTable}>▦ Table</ToolbarButton>
        <ToolbarButton title="Insert image from URL" onClick={onInsertImage}>▧ Image</ToolbarButton>
        <ToolbarButton title="Horizontal line" onFormat={onFormat} command="insertHorizontalRule">―</ToolbarButton>
        <ToolbarButton title="Block quote" onFormat={onFormat} command="formatBlock" value="blockquote">❝</ToolbarButton>
        <ToolbarButton title="Clear formatting" onFormat={onFormat} command="removeFormat">Tx</ToolbarButton>
      </div>

      <div className="dc-tool-group dc-history-group">
        <ToolbarButton title="Undo" onFormat={onFormat} command="undo">↶</ToolbarButton>
        <ToolbarButton title="Redo" onFormat={onFormat} command="redo">↷</ToolbarButton>
        <ToolbarButton title="Print document" onClick={onPrint}>Print</ToolbarButton>
        <ToolbarButton title="Download HTML" onClick={onDownloadHtml}>HTML</ToolbarButton>
      </div>
    </div>
  </div>
);

/* Sidebar list */
const DocList = ({ docs, activeId, onNew, onOpen, onDelete, loading }) => (
  <aside className="dc-sidebar">
    <div className="dc-brand">
      <div className="dc-brand-mark">D</div>
      <div><strong>Document Creator</strong><small>AME Messenger</small></div>
    </div>

    <button className="dc-new-btn" type="button" onClick={onNew}>＋ <span>New document</span></button>

    <div className="dc-list-heading">
      <span>MY DOCUMENTS</span>
      <span className="dc-doc-count">{docs.length}</span>
    </div>

    {loading ? (
      <p className="dc-list-message">Loading documents…</p>
    ) : docs.length === 0 ? (
      <p className="dc-list-message">No documents yet. Create your first document.</p>
    ) : (
      <ul className="dc-doc-list">
        {docs.map((doc) => (
          <li key={doc.id} className={doc.id === activeId ? 'active' : ''}>
            <button className="dc-doc-open" type="button" onClick={() => onOpen(doc.id)}>
              <strong>{doc.title || 'Untitled document'}</strong>
              <small>{doc.updatedAt ? new Date(doc.updatedAt).toLocaleString() : 'Recently created'}</small>
            </button>
            <button className="dc-doc-delete" type="button" aria-label={`Delete ${doc.title || 'document'}`} title="Delete document" onClick={() => onDelete(doc.id)}>✕</button>
          </li>
        ))}
      </ul>
    )}
  </aside>
);

/* Editor */
const Editor = ({ doc, onSaved }) => {
  const [title, setTitle] = useState(doc.title || 'Untitled document');
  const [status, setStatus] = useState('Saved');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('4');
  const [stats, setStats] = useState({ words: 0, characters: 0 });
  const pageRef = useRef(null);
  const titleRef = useRef(title);
  const timerRef = useRef(null);
  const savedRangeRef = useRef(null);

  const refreshStats = useCallback(() => {
    const text = pageRef.current?.innerText || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setStats({ words, characters: text.length });
  }, []);

  const saveSelection = useCallback(() => {
    const page = pageRef.current;
    const selection = window.getSelection();
    if (!page || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (page.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const page = pageRef.current;
    const range = savedRangeRef.current;
    if (!page || !range || !page.contains(range.commonAncestorContainer)) {
      page?.focus();
      return;
    }

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    page.focus();
  }, []);

  const saveNow = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (!pageRef.current) return false;

    try {
      setStatus('Saving…');
      const saved = await updateDocument(doc.id, {
        title: titleRef.current.trim() || 'Untitled document',
        content: DOMPurify.sanitize(pageRef.current.innerHTML),
      });
      onSaved(saved);
      setStatus('Saved ✓');
      return true;
    } catch (error) {
      console.error('Document save failed:', error);
      setStatus('Save failed — retry');
      return false;
    }
  }, [doc.id, onSaved]);

  const queueSave = useCallback(() => {
    setStatus('Unsaved changes');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { saveNow(); }, AUTOSAVE_DELAY);
  }, [saveNow]);

  useEffect(() => {
    if (!pageRef.current) return undefined;
    pageRef.current.innerHTML = DOMPurify.sanitize(doc.content || '');
    titleRef.current = doc.title || 'Untitled document';
    setTitle(titleRef.current);
    refreshStats();
    setStatus('Saved');
    return () => clearTimeout(timerRef.current);
  }, [doc.id, doc.content, doc.title, refreshStats]);

  const handleTitle = (event) => {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    titleRef.current = nextTitle;
    queueSave();
  };

  const handleFormat = (command, value) => {
    restoreSelection();
    document.execCommand(command, false, value ?? null);
    pageRef.current?.focus();
    saveSelection();
    refreshStats();
    queueSave();
  };

  const insertHtml = (html) => {
    restoreSelection();
    const safeHtml = DOMPurify.sanitize(html);
    document.execCommand('insertHTML', false, safeHtml);
    pageRef.current?.focus();
    saveSelection();
    refreshStats();
    queueSave();
  };

  const insertLink = () => {
    const rawUrl = window.prompt('Enter the link URL:');
    if (!rawUrl) return;
    const url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      window.alert('Please enter a complete URL starting with https:// or http://');
      return;
    }
    restoreSelection();
    const selection = window.getSelection()?.toString();
    if (selection) {
      document.execCommand('createLink', false, url);
    } else {
      insertHtml(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    }
    pageRef.current?.focus();
    saveSelection();
    queueSave();
  };

  const insertTable = () => {
    const rowsInput = window.prompt('Number of rows (1–10):', '3');
    if (rowsInput === null) return;
    const colsInput = window.prompt('Number of columns (1–8):', '3');
    if (colsInput === null) return;
    const rows = Math.min(10, Math.max(1, Number.parseInt(rowsInput, 10) || 3));
    const cols = Math.min(8, Math.max(1, Number.parseInt(colsInput, 10) || 3));
    const tableRows = Array.from({ length: rows }, () =>
      `<tr>${Array.from({ length: cols }, () => '<td>&nbsp;</td>').join('')}</tr>`
    ).join('');
    insertHtml(`<table class="dc-content-table"><tbody>${tableRows}</tbody></table><p><br></p>`);
  };

  const insertImage = () => {
    const rawUrl = window.prompt('Enter an image URL (https://…):');
    if (!rawUrl) return;
    const url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      window.alert('Please enter a valid image URL starting with https:// or http://');
      return;
    }
    insertHtml(`<p><img src="${url}" alt="Document image" style="max-width:100%;height:auto;"></p>`);
  };

  const downloadPdf = () => {
    if (!pageRef.current) return;
    const box = document.createElement('div');
    box.className = 'dc-export-document';
    const heading = document.createElement('h1');
    heading.textContent = title.trim() || 'Untitled document';
    box.append(heading);
    box.insertAdjacentHTML('beforeend', DOMPurify.sanitize(pageRef.current.innerHTML));

    html2pdf().set({
      margin: [15, 16, 15, 16],
      filename: `${(title.trim() || 'document').replace(/[\\/:*?"<>|]/g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      pagebreak: { mode: ['css', 'legacy'] },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(box).save();
  };

  const downloadHtml = () => {
    if (!pageRef.current) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${DOMPurify.sanitize(title)}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 24px;line-height:1.65;color:#202124}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:8px}img{max-width:100%;height:auto}blockquote{border-left:4px solid #94a3b8;margin-left:0;padding-left:16px;color:#475569}</style></head><body>${DOMPurify.sanitize(pageRef.current.innerHTML)}</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(title.trim() || 'document').replace(/[\\/:*?"<>|]/g, '-')}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = async () => {
    const saved = await saveNow();
    if (saved) window.print();
  };

  const handleFontFamily = (value) => {
    setFontFamily(value);
    handleFormat('fontName', value);
  };

  const handleFontSize = (value) => {
    setFontSize(value);
    handleFormat('fontSize', value);
  };

  const handleEditorKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveNow();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      insertLink();
    }
  };

  return (
    <div className="dc-editor">
      <header className="dc-topbar">
        <div className="dc-title-area">
          <span className="dc-document-icon">▤</span>
          <input
            className="dc-title-input"
            value={title}
            onChange={handleTitle}
            onKeyDown={handleEditorKeyDown}
            placeholder="Document title"
            aria-label="Document title"
          />
        </div>
        <div className={`dc-status ${status.includes('failed') ? 'is-error' : ''}`} aria-live="polite">
          <span className="dc-status-dot" />{status}
        </div>
        <div className="dc-top-actions">
          <button className="dc-save-btn" type="button" onClick={saveNow} title="Save now (Ctrl+S)">Save</button>
          <button className="dc-pdf-btn" type="button" onClick={downloadPdf}>↓ PDF</button>
        </div>
      </header>

      <Toolbar
        onFormat={handleFormat}
        onLink={insertLink}
        onInsertTable={insertTable}
        onInsertImage={insertImage}
        onPrint={handlePrint}
        onDownloadHtml={downloadHtml}
        fontFamily={fontFamily}
        onFontFamilyChange={handleFontFamily}
        fontSize={fontSize}
        onFontSizeChange={handleFontSize}
      />

      <div className="dc-canvas">
        <div className="dc-page-shell">
          <div
            ref={pageRef}
            className="dc-page"
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Document content"
            aria-multiline="true"
            data-placeholder="Start writing your document here…"
            data-title={title.trim() || 'Untitled document'}
            onInput={() => { refreshStats(); queueSave(); }}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            onKeyDown={handleEditorKeyDown}
            onBlur={() => { saveSelection(); saveNow(); }}
          />
        </div>
      </div>

      <footer className="dc-editor-footer">
        <span>{stats.words} words</span>
        <span>{stats.characters} characters</span>
        <span>Auto-save enabled</span>
        <span className="dc-shortcut-hint">Ctrl + S to save · Ctrl + K to add link</span>
      </footer>
    </div>
  );
};

/* Main page */
const Document = () => {
  const [docs, setDocs] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listDocuments()
      .then((items) => { if (!cancelled) setDocs(Array.isArray(items) ? items : []); })
      .catch((error) => { if (!cancelled) setPageError(error.message || 'Unable to load documents.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleNew = async () => {
    try {
      setPageError('');
      const doc = await createDocument();
      setDocs((previous) => [{ id: doc.id, title: doc.title, updatedAt: doc.updatedAt }, ...previous]);
      setActiveDoc(doc);
    } catch (error) {
      setPageError(error.message || 'Unable to create document.');
    }
  };

  const handleOpen = async (id) => {
    try {
      setPageError('');
      const doc = await getDocument(id);
      setActiveDoc(doc);
    } catch (error) {
      setPageError(error.message || 'Unable to open document.');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Delete this document? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteDocument(id);
      setDocs((previous) => previous.filter((doc) => doc.id !== id));
      if (activeDoc?.id === id) setActiveDoc(null);
      setPageError('');
    } catch (error) {
      setPageError(error.message || 'Unable to delete document.');
    }
  };

  const handleSaved = (saved) => {
    setDocs((previous) => previous.map((doc) => (
      doc.id === saved.id
        ? { ...doc, title: saved.title, updatedAt: saved.updatedAt }
        : doc
    )));
  };

  return (
    <div className="doc-creator">
      <DocList
        docs={docs}
        activeId={activeDoc?.id}
        onNew={handleNew}
        onOpen={handleOpen}
        onDelete={handleDelete}
        loading={loading}
      />
      <main className="dc-workspace">
        {pageError && <div className="dc-page-error" role="alert">{pageError}</div>}
        {activeDoc ? (
          <Editor key={activeDoc.id} doc={activeDoc} onSaved={handleSaved} />
        ) : (
          <div className="dc-empty-state">
            <div className="dc-empty-icon">▤</div>
            <h2>{loading ? 'Loading your documents…' : 'Your workspace is ready'}</h2>
            <p>{loading ? 'Please wait while your documents load.' : 'Choose a document from the left or create a new one to get started.'}</p>
            {!loading && <button type="button" className="dc-new-btn dc-empty-new" onClick={handleNew}>＋ Create document</button>}
          </div>
        )}
      </main>
    </div>
  );
};

export default Document;
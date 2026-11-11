import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import html2pdf from 'html2pdf.js';
import './Documentcreation.css';

/*  API  */
const BASE = 'http://localhost:5001/api/documents';

const request = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('ameToken')}`,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
};

const listDocuments = () => request(BASE);
const getDocument = (id) => request(`${BASE}/${id}`);
const createDocument = (data = {}) => request(BASE, { method: 'POST', body: JSON.stringify(data) });
const updateDocument = (id, data) => request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
const deleteDocument = (id) => request(`${BASE}/${id}`, { method: 'DELETE' });

/* Toolbar  */
const TOOLS = [
  { label: <b>B</b>, cmd: 'bold' },
  { label: <i>I</i>, cmd: 'italic' },
  { label: <u>U</u>, cmd: 'underline' },
  { label: 'H1', cmd: 'formatBlock', val: 'h1' },
  { label: 'H2', cmd: 'formatBlock', val: 'h2' },
  { label: 'Text', cmd: 'formatBlock', val: 'p' },
  { label: '• List', cmd: 'insertUnorderedList' },
  { label: '1. List', cmd: 'insertOrderedList' },
  { label: 'Left', cmd: 'justifyLeft' },
  { label: 'Center', cmd: 'justifyCenter' },
  { label: 'Right', cmd: 'justifyRight' },
  { label: 'Undo', cmd: 'undo' },
  { label: 'Redo', cmd: 'redo' },
];

const Toolbar = ({ onFormat }) => (
  <div className="dc-toolbar">
    {TOOLS.map(({ label, cmd, val }) => (
      <button
        key={cmd + (val ?? '')}
        // mouseDown + preventDefault keeps the text selection inside the editor
        onMouseDown={(e) => {
          e.preventDefault();
          onFormat(cmd, val);
        }}
      >
        {label}
      </button>
    ))}
  </div>
);

/*Sidebar list*/
const DocList = ({ docs, activeId, onNew, onOpen, onDelete }) => (
  <aside className="dc-sidebar">
    <button className="dc-new-btn" onClick={onNew}>+ New document</button>
    <ul>
      {docs.map((d) => (
        <li key={d.id} className={d.id === activeId ? 'active' : ''}>
          <button className="dc-doc-open" onClick={() => onOpen(d.id)}>
            <strong>{d.title || 'Untitled document'}</strong>
            <small>{new Date(d.updatedAt).toLocaleString()}</small>
          </button>
          <button className="dc-doc-delete" aria-label="Delete" onClick={() => onDelete(d.id)}>✕</button>
        </li>
      ))}
    </ul>
  </aside>
);

/*Editor*/
const AUTOSAVE_DELAY = 1000; // ms

const Editor = ({ doc, onSaved }) => {
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState('Saved');
  const pageRef = useRef(null);
  const titleRef = useRef(doc.title); // always holds the latest title for the timer
  const timerRef = useRef(null);

  // load content once; sanitize so stored HTML can't run scripts
  useEffect(() => {
    pageRef.current.innerHTML = DOMPurify.sanitize(doc.content);
    return () => clearTimeout(timerRef.current);
  }, [doc.content]);

  const queueSave = () => {
    setStatus('Typing…');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        setStatus('Saving…');
        const saved = await updateDocument(doc.id, {
          title: titleRef.current,
          content: DOMPurify.sanitize(pageRef.current.innerHTML),
        });
        onSaved(saved);
        setStatus('Saved ✔');
      } catch {
        setStatus('Save failed');
      }
    }, AUTOSAVE_DELAY);
  };

  const handleTitle = (e) => {
    setTitle(e.target.value);
    titleRef.current = e.target.value;
    queueSave();
  };

  const handleFormat = (cmd, val) => {
    document.execCommand(cmd, false, val ?? null);
    pageRef.current.focus();
    queueSave();
  };

  const downloadPdf = () => {
    const box = document.createElement('div');
    const heading = document.createElement('h1');
    heading.textContent = title;
    box.append(heading);
    box.insertAdjacentHTML('beforeend', DOMPurify.sanitize(pageRef.current.innerHTML));

    html2pdf()
      .set({
        margin: 15,
        filename: `${title.trim() || 'document'}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4' },
      })
      .from(box)
      .save();
  };

  return (
    <div className="dc-editor">
      <header className="dc-topbar">
        <input className="dc-title-input" value={title} onChange={handleTitle} placeholder="Document title" />
        <span className="dc-status">{status}</span>
        <button className="dc-pdf-btn" onClick={downloadPdf}>Download PDF</button>
      </header>
      <Toolbar onFormat={handleFormat} />
      <div className="dc-canvas">
        <div ref={pageRef} className="dc-page" contentEditable suppressContentEditableWarning onInput={queueSave} />
      </div>
    </div>
  );
};

/*Main page*/
const Document = () => {
  const [docs, setDocs] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);

  useEffect(() => {
    listDocuments().then(setDocs).catch(console.error);
  }, []);

const handleNew = async () => {
  try {
    const doc = await createDocument();
    setDocs((prev) => [{ id: doc.id, title: doc.title, updatedAt: doc.updatedAt }, ...prev]);
    setActiveDoc(doc);
  } catch (err) {
    console.error(err);
    alert(err.message); // shows the real reason
  }
};

  const handleOpen = async (id) => setActiveDoc(await getDocument(id));

  const handleDelete = async (id) => {
    await deleteDocument(id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (activeDoc?.id === id) setActiveDoc(null);
  };

  // called by Editor after every successful autosave
  const handleSaved = (saved) =>
    setDocs((prev) => prev.map((d) => (d.id === saved.id ? { ...d, title: saved.title, updatedAt: saved.updatedAt } : d)));

  return (
    <div className="doc-creator">
      <DocList docs={docs} activeId={activeDoc?.id} onNew={handleNew} onOpen={handleOpen} onDelete={handleDelete} />
      <main className="dc-workspace">
        {activeDoc ? (
          <Editor key={activeDoc.id} doc={activeDoc} onSaved={handleSaved} />
        ) : (
          <p className="dc-empty">Select a document or create a new one.</p>
        )}
      </main>
    </div>
  );
};

export default Document;
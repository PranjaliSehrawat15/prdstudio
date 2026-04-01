'use client';

import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Download, FileText, FileUp, Zap, Server, ScanText, Bold, Heading1, Heading2, Heading3, List, ListOrdered, Minus, Trash2, FilePlus2, AlignCenter } from 'lucide-react';
import { exportToMultiLayerPDF } from '../lib/pdfEngine';
import * as pdfjsLib from 'pdfjs-dist';

// Set the worker source for PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export default function Home() {
  const [documentText, setDocumentText] = useState('');
  const [pdfRefBase64, setPdfRefBase64] = useState<string | null>(null);
  const [sourceMode, setSourceMode] = useState<'text' | 'pdf'>('text');
  const [isExtracting, setIsExtracting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Toolbar formatting helper — works on current line, toggles on/off
  const applyFormat = (type: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const cursorPos = ta.selectionStart;
    const selEnd = ta.selectionEnd;

    // Find the start and end of the current line
    const lineStart = documentText.lastIndexOf('\n', cursorPos - 1) + 1;
    let lineEnd = documentText.indexOf('\n', cursorPos);
    if (lineEnd === -1) lineEnd = documentText.length;
    const currentLine = documentText.substring(lineStart, lineEnd);

    const before = documentText.substring(0, lineStart);
    const after = documentText.substring(lineEnd);

    let newText = documentText;
    let newCursorPos = cursorPos;

    // Heading toggles — apply to current line
    const headingPrefixes: Record<string, string> = { h1: '# ', h2: '## ', h3: '### ' };

    if (type in headingPrefixes) {
      const prefix = headingPrefixes[type];
      // Remove any existing heading prefix first
      let cleanLine = currentLine.replace(/^#{1,3}\s*/, '');
      
      if (currentLine.startsWith(prefix)) {
        // Already has this heading → remove it (toggle off)
        newText = before + cleanLine + after;
        newCursorPos = lineStart + cleanLine.length;
      } else {
        // Apply heading
        const newLine = prefix + cleanLine;
        newText = before + newLine + after;
        newCursorPos = lineStart + newLine.length;
      }
    } else if (type === 'bold') {
      const selected = documentText.substring(cursorPos, selEnd);
      if (selected) {
        // If selected text is already bold, remove **
        if (selected.startsWith('**') && selected.endsWith('**')) {
          const clean = selected.slice(2, -2);
          newText = documentText.substring(0, cursorPos) + clean + documentText.substring(selEnd);
          newCursorPos = cursorPos + clean.length;
        } else {
          const bold = '**' + selected + '**';
          newText = documentText.substring(0, cursorPos) + bold + documentText.substring(selEnd);
          newCursorPos = cursorPos + bold.length;
        }
      }
    } else if (type === 'ul') {
      if (currentLine.startsWith('- ')) {
        // Toggle off
        const cleanLine = currentLine.substring(2);
        newText = before + cleanLine + after;
        newCursorPos = lineStart + cleanLine.length;
      } else {
        const newLine = '- ' + currentLine;
        newText = before + newLine + after;
        newCursorPos = lineStart + newLine.length;
      }
    } else if (type === 'ol') {
      if (/^\d+\.\s/.test(currentLine)) {
        // Toggle off
        const cleanLine = currentLine.replace(/^\d+\.\s/, '');
        newText = before + cleanLine + after;
        newCursorPos = lineStart + cleanLine.length;
      } else {
        const newLine = '1. ' + currentLine;
        newText = before + newLine + after;
        newCursorPos = lineStart + newLine.length;
      }
    } else if (type === 'hr') {
      const hrLine = '\n---\n';
      newText = documentText.substring(0, cursorPos) + hrLine + documentText.substring(cursorPos);
      newCursorPos = cursorPos + hrLine.length;
    } else if (type === 'center') {
      const selected = documentText.substring(cursorPos, selEnd);
      if (selected) {
        // Check for tags even if they have newlines
        const pattern = /^<center>\n*([\s\S]*?)\n*<\/center>$/;
        const match = selected.match(pattern);
        if (match) {
          const clean = match[1];
          newText = documentText.substring(0, cursorPos) + clean + documentText.substring(selEnd);
          newCursorPos = cursorPos + clean.length;
        } else {
          const centered = `<center>\n\n${selected}\n\n</center>`;
          newText = documentText.substring(0, cursorPos) + centered + documentText.substring(selEnd);
          newCursorPos = cursorPos + centered.length;
        }
      } else {
        const centered = '<center>\n\nCentered Text\n\n</center>';
        newText = documentText.substring(0, cursorPos) + centered + documentText.substring(cursorPos);
        newCursorPos = cursorPos + centered.length;
      }
    }

    setDocumentText(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };


  const prdTemplate = `# Exhibit A

## Software Specifications

---

# [Product Name]

## (FREEFORM PRODUCT FUNCTIONALITY DESCRIPTION)

---

**Prepared for:**

[Client Name]

[Client Company]

**Prepared by:**

[Your Name]

Hooc AI Technologies

---
---

## 1. PRODUCT OVERVIEW

### 1.1 Vision
[Describe the product vision — what problem does it solve and why does it matter.]

### Platforms
- [Android Mobile Application]
- [Dynamic Website]
- [Admin Panel (Web-based)]

---

## 2. USER ROLES & LOGIN SYSTEM

### 2.1 Admin
- Full system access
- Activate / Suspend / Block users
- Manage packages
- View reports

### 2.2 Associate / Agent
- Login access
- Create / manage bookings
- View assigned customers
- Track commissions

### 2.3 Customer / User
- Register & login
- Browse packages
- Book seats
- Upload ID proof
- Download ticket

---

## 3. CORE FEATURES

### MODULE A: [MODULE NAME]
[Description of this module]

- [Feature 1]
- [Feature 2]
- [Feature 3]

### MODULE B: [MODULE NAME]
[Description of this module]

- [Feature 1]
- [Feature 2]

### MODULE C: [MODULE NAME]
[Description of this module]

- [Feature 1]
- [Feature 2]

---

## 4. ADMIN PANEL FEATURES

Admin can:
- Create / Edit / Delete items
- Manage seat limits
- Activate / Suspend users
- Approve associates
- View analytics
- Generate financial reports
- Manage content pages

---

## 5. TECHNOLOGY STACK

**Mobile App:** [Flutter / React Native]
**Frontend:** [React.js / Next.js]
**Backend:** [Node.js (Express)]
**Database:** [PostgreSQL / MongoDB]
**Cloud:** [AWS EC2 / S3]
**Payment:** [Razorpay]
**Notifications:** [Firebase Cloud Messaging / SMS Gateway]

---

## 6. SECURITY REQUIREMENTS

- Secure login (OTP + password)
- Role-based access control
- Data encryption
- Secure payment processing
- Admin audit logs

---

## 7. NON-FUNCTIONAL REQUIREMENTS

**Performance:**
- Page load under 3 seconds
- Booking confirmation under 5 seconds

**Scalability:**
- Support 50,000+ users

**Availability:**
- 99% uptime

---

## 8. REPORTING & ANALYTICS

Admin dashboard includes:
- Total bookings
- Revenue report
- EMI outstanding report
- Seat occupancy report
- Associate performance report
- Refund report

---

## 9. FUTURE ENHANCEMENTS

- Loyalty reward points
- Travel insurance add-on
- In-app chat
- GPS tracking
- Bulk booking option

---

## 10. APPROVAL

This PRD requires formal approval before development begins.

**Client Name:** _______________

**Signature:** _______________

**Date:** _______________

---

*Prepared by Hooc AI Technologies*
`;

  // Hooc AI Company Settings (Hardcoded)
  const companyName = 'Hooc AI Technologies';
  const watermarkText = 'Confidential By HOOC AI';

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPdfRefBase64(reader.result as string);
        setSourceMode('pdf');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtractText = async () => {
    if (!pdfRefBase64) return;
    setIsExtracting(true);
    try {
      const base64Data = pdfRefBase64.split(',')[1];
      const binaryStr = window.atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item): item is { str: string } & typeof item => 'str' in item)
          .map((item) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      setDocumentText(fullText.trim());
      setSourceMode('text');
    } catch (err) {
      console.error('Text extraction failed:', err);
      alert('Could not extract text from this PDF. The PDF may be image-based or encrypted.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExport = async () => {
    try {
      if (sourceMode === 'pdf' && pdfRefBase64) {
        await exportToMultiLayerPDF({
          companyName: companyName,
          watermarkText: watermarkText,
          securityText: "CONFIDENTIAL BY HOOC AI - NOT FOR DISTRIBUTION - DO NOT COPY ",
          pdfBytesBase64: pdfRefBase64
        });
      } else {
        if (!documentText.trim()) {
          alert("Please provide text content or upload a PDF first.");
          return;
        }
        await exportToMultiLayerPDF({
          companyName: companyName,
          watermarkText: watermarkText,
          securityText: "CONFIDENTIAL BY HOOC AI - NOT FOR DISTRIBUTION - DO NOT COPY ",
          content: documentText
        });
      }
    } catch (e) {
      console.error(e);
      alert("Error generating PDF. Please check the console.");
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#050505] text-zinc-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">

      {/* Background ambient neon glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px] pointer-events-none" />

      {/* Cyber-Corporate Header */}
      <header className="h-[56px] lg:h-[72px] shrink-0 flex items-center justify-between px-4 md:px-8 glass border-b border-zinc-800/80 sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3 font-semibold text-sm md:text-lg tracking-wider text-zinc-100 uppercase">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse-glow">
            <Server size={16} strokeWidth={1.5} className="md:hidden" />
            <Server size={20} strokeWidth={1.5} className="hidden md:block" />
          </div>
          <span>PRD<span className="hidden sm:inline">_STUDIO</span><span className="text-cyan-500">.SYS</span></span>
        </div>

        <button
          onClick={handleExport}
          className="group relative flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-400 font-bold text-[10px] md:text-xs uppercase tracking-widest px-4 md:px-8 py-2 md:py-3 rounded-lg border border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] transition-all duration-300 overflow-hidden"
        >
          {/* Button inner glow focus */}
          <div className="absolute inset-0 bg-cyan-400/20 blur-md group-hover:bg-cyan-400/40 transition-all" />
          <Download size={14} className="relative z-10 md:hidden" />
          <Download size={16} className="relative z-10 hidden md:block" />
          <span className="relative z-10 hidden sm:inline">Export Encrypted PDF</span>
          <span className="relative z-10 sm:hidden">Export</span>
        </button>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative z-10">

        {/* Left Panel - Dark Workspace */}
        <div className="w-full lg:w-[500px] shrink-0 overflow-y-auto glass-light border-b lg:border-b-0 lg:border-r border-zinc-800/80 p-4 md:p-8 flex flex-col">

          <div className="mb-6 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <div className="font-mono text-sm tracking-widest text-zinc-400 uppercase">Input_Terminal</div>
          </div>

          <div className="bg-[#111]/90 rounded-xl p-6 border border-zinc-800/60 shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col gap-6 transition-all hover:border-zinc-700/80 animate-float-in">

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-[0.2em] pl-1">DATA_SOURCE</span>
              <div className="flex bg-[#050505] p-1.5 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setSourceMode('text')}
                  className={'flex-1 py-2.5 text-xs font-mono uppercase tracking-wider rounded transition-all ' + (sourceMode === 'text' ? 'bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'text-zinc-600 hover:text-zinc-400')}
                >
                  Raw_Text
                </button>
                <button
                  onClick={() => setSourceMode('pdf')}
                  className={'flex-1 py-2.5 text-xs font-mono uppercase tracking-wider rounded transition-all ' + (sourceMode === 'pdf' ? 'bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'text-zinc-600 hover:text-zinc-400')}
                >
                  Load_PDF
                </button>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent w-full" />

            {sourceMode === 'text' ? (
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2 text-zinc-300 font-mono text-xs pl-1">
                  <FileText size={14} className="text-cyan-500" />
                  STREAM_BUFFER
                </div>

                {/* Formatting Toolbar */}
                <div className="flex items-center gap-0.5 bg-[#080808] border border-zinc-800/60 rounded-xl p-1 flex-wrap">
                  <button onClick={() => applyFormat('h1')} title="Heading 1" className="toolbar-btn p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-cyan-400 transition-all"><Heading1 size={16} /></button>
                  <button onClick={() => applyFormat('h2')} title="Heading 2" className="toolbar-btn p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-cyan-400 transition-all"><Heading2 size={16} /></button>
                  <button onClick={() => applyFormat('h3')} title="Heading 3" className="toolbar-btn p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-cyan-400 transition-all"><Heading3 size={16} /></button>
                  <div className="w-px h-5 bg-zinc-800/50 mx-0.5" />
                  <button onClick={() => applyFormat('bold')} title="Bold" className="toolbar-btn p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-cyan-400 transition-all"><Bold size={16} /></button>
                  <div className="w-px h-5 bg-zinc-800/50 mx-0.5" />
                  <button onClick={() => applyFormat('ul')} title="Bullet List" className="toolbar-btn p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-cyan-400 transition-all"><List size={16} /></button>
                  <button onClick={() => applyFormat('ol')} title="Numbered List" className="toolbar-btn p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-cyan-400 transition-all"><ListOrdered size={16} /></button>
                  <div className="w-px h-5 bg-zinc-800/50 mx-0.5" />
                  <button onClick={() => applyFormat('hr')} title="Horizontal Line" className="toolbar-btn p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-cyan-400 transition-all"><Minus size={16} /></button>
                  <div className="w-px h-5 bg-zinc-800/50 mx-0.5" />
                  <button onClick={() => applyFormat('center')} title="Center Align" className="toolbar-btn p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-cyan-400 transition-all"><AlignCenter size={16} /></button>
                  <div className="w-px h-5 bg-zinc-800/50 mx-0.5" />
                  <button
                    onClick={() => { if (!documentText.trim() || confirm('This will replace your current text with a PRD template. Continue?')) setDocumentText(prdTemplate); }}
                    title="Insert PRD Template"
                    className="toolbar-btn p-2 rounded-lg hover:bg-zinc-800/80 text-zinc-500 hover:text-emerald-400 transition-all flex items-center gap-1 text-[10px] font-mono uppercase"
                  >
                    <FilePlus2 size={16} />
                    <span className="hidden sm:inline">Template</span>
                  </button>
                </div>

                <div className="relative group flex-1">
                  <div className="absolute -inset-0.5 bg-gradient-to-b from-cyan-500/20 to-transparent rounded-lg blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                  <textarea
                    ref={textareaRef}
                    className="relative w-full min-h-[450px] bg-[#050505] border border-zinc-800 rounded-lg p-5 text-sm leading-relaxed text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/50 font-mono resize-y"
                    placeholder={"> Initialize PRD parameters here...\n> Supports Markdown Syntax."}
                    value={documentText}
                    onChange={(e) => setDocumentText(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono px-2 leading-relaxed uppercase">
                  <span>[*] Select text → click toolbar to format</span>
                  <span className="text-cyan-500/50">{documentText.length} chars · {documentText.trim() ? documentText.trim().split(/\s+/).length : 0} words</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-zinc-300 font-mono text-xs pl-1">
                  <FileUp size={14} className="text-cyan-500" />
                  UPLOAD_GATEWAY
                </div>
                <div className="border border-dashed border-zinc-700 hover:border-cyan-500/50 bg-[#050505] hover:bg-cyan-950/10 transition-colors rounded-lg p-10 flex flex-col items-center justify-center text-center gap-4 cursor-pointer relative group">
                  {/* Cyber Upload Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 group-hover:opacity-60 transition-opacity" />
                    <div className="h-14 w-14 rounded border border-cyan-500/30 bg-zinc-900 flex items-center justify-center text-cyan-400 relative z-10 group-hover:-translate-y-1 transition-transform">
                      <FileUp size={24} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="font-mono text-sm text-zinc-300 tracking-wide uppercase">Select Target Vector</span>
                    <span className="text-[10px] font-mono text-zinc-600">DRAG/DROP OR BROWSE LOCAL FILES</span>
                  </div>
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {pdfRefBase64 && (
                  <>
                    <div className="mt-4 border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 font-mono text-[10px] px-4 py-3 rounded flex items-center justify-center uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      [+] PDF Buffer Acquired
                    </div>
                    <button
                      onClick={handleExtractText}
                      disabled={isExtracting}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded border border-amber-500/50 bg-amber-500/10 text-amber-400 font-mono text-xs uppercase tracking-widest hover:bg-amber-500/20 hover:border-amber-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ScanText size={14} />
                      {isExtracting ? 'Extracting...' : 'Extract & Edit Text'}
                    </button>
                    <button
                      onClick={() => { setPdfRefBase64(null); setSourceMode('text'); }}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-xs uppercase tracking-widest hover:bg-red-500/20 hover:border-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                      Remove File
                    </button>
                    <p className="text-[10px] text-zinc-600 font-mono px-2 leading-relaxed uppercase mt-1">
                      [*] Extract text to edit, or remove to start fresh.
                    </p>
                  </>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Right Panel - Render Canvas */}
        <div className="flex-1 overflow-y-auto bg-[#050505] p-4 md:p-8 lg:p-12 flex justify-center relative">

          {/* Subtle Grid Pattern for tech feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-20 pointer-events-none" />

          <div className="w-full max-w-[850px] flex flex-col gap-6 relative z-10">

            {/* HUD Status Bar */}
            <div className="w-full flex justify-between items-center glass rounded-xl px-5 py-2.5 font-mono text-[10px] uppercase text-zinc-500 tracking-widest">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                {sourceMode === 'pdf' ? 'REFERENCE_VIEW_ACTIVE' : 'RENDER_ENGINE_ONLINE'}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-zinc-700">LAYER_COUNT: <span className="text-cyan-500/70">3</span></span>
                <span className="text-zinc-700">SECURE: <span className="text-emerald-500/70">ON</span></span>
              </div>
            </div>

            {sourceMode === 'pdf' && pdfRefBase64 ? (
              <div className="h-[950px] w-full bg-[#111] rounded-xl shadow-2xl overflow-hidden border border-zinc-800 ring-1 ring-white/5">
                <iframe src={pdfRefBase64} className="h-full w-full border-none opacity-90" title="Reference PDF"></iframe>
              </div>
            ) : (
              <div className="min-h-[500px] lg:min-h-[1056px] w-full bg-white rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] p-6 md:p-12 lg:p-24 border-0 relative overflow-hidden group transition-all">

                {/* Animated scan line */}
                <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent animate-scan-line pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Center logo watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.jpeg" alt="" className="w-44 h-44 opacity-[0.06]" draggable={false} />
                </div>

                {/* Paper Watermark Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none rotate-45 transform font-mono font-bold text-8xl text-black tracking-[0.2em] -z-10">
                  {watermarkText}
                </div>

                <div className="flex flex-col prose max-w-none">
                  {documentText ? (
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>{documentText}</ReactMarkdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-400 gap-6 mt-32">
                      <div className="relative">
                        <div className="absolute inset-0 bg-zinc-200 blur-2xl rounded-full opacity-50" />
                        <div className="relative h-16 w-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                          <Zap size={28} strokeWidth={1} className="text-zinc-400" />
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-semibold tracking-wide text-zinc-500" style={{fontFamily: 'Inter, sans-serif'}}>No Content Yet</span>
                        <span className="text-xs text-zinc-400 text-center max-w-[280px]" style={{fontFamily: 'Inter, sans-serif'}}>Start typing in the editor or load a PRD template to begin</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

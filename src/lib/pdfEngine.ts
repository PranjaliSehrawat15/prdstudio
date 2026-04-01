import { jsPDF } from 'jspdf';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface PDFExportOptions {
  companyName: string;
  watermarkText: string;
  securityText: string;
  content?: string; // If text mode
  pdfBytesBase64?: string; // If pdf upload mode
}

/**
 * Universally stamps the 3 security layers onto an existing PDF buffer.
 * - Layer 1: Full-page watermark image (Confidential By HOOC AI pattern)
 * - Layer 1B: Centered logo watermark (H logo, semi-transparent)
 * - Layer 2: Company identity header/footer with HOOC AI branding
 * - Layer 3: Anti-scraping invisible text shield
 */
async function applySecurityLayers(pdfBytes: Uint8Array, options: PDFExportOptions): Promise<Uint8Array> {
  const { securityText } = options;
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);


  // Load watermark image (diagonal "Confidential By HOOC AI" pattern)
  let watermarkImage;
  try {
    const imgRes = await fetch('/watermark.png');
    if (imgRes.ok) {
      const imgBytes = await imgRes.arrayBuffer();
      watermarkImage = await pdfDoc.embedPng(imgBytes);
    }
  } catch (err) {
    console.error("Failed to load watermark image", err);
  }

  // Load company logo (HOOC AI "H" logo) - supports JPEG
  let logoImage;
  try {
    const logoRes = await fetch('/logo.jpeg');
    if (logoRes.ok) {
      const logoBytes = await logoRes.arrayBuffer();
      logoImage = await pdfDoc.embedJpg(logoBytes);
    }
  } catch (err) {
    console.error("Failed to load logo image", err);
  }

  const pages = pdfDoc.getPages();

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    // ============================================
    // LAYER 1A: Full-page watermark image
    // "Confidential By HOOC AI" diagonal text pattern
    // ============================================
    if (watermarkImage) {
      page.drawImage(watermarkImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
        opacity: 0.15,
      });
    }

    // ============================================
    // LAYER 1B: Centered logo watermark
    // HOOC AI "H" logo in center at low opacity
    // ============================================
    if (logoImage) {
      const logoSize = 180;
      page.drawImage(logoImage, {
        x: (width - logoSize) / 2,
        y: (height - logoSize) / 2,
        width: logoSize,
        height: logoSize,
        opacity: 0.08,
      });
    }

    // ============================================
    // LAYER 2: Company Identity Branding
    // ============================================

    // --- Header: Small logo top-left on all pages ---
    if (logoImage) {
      const headerLogoSize = 30;
      page.drawImage(logoImage, {
        x: 35,
        y: height - 55,
        width: headerLogoSize,
        height: headerLogoSize,
        opacity: 0.9,
      });
    }



    // ============================================
    // LAYER 3: Anti-Scraping Shield (LAST — on top)
    // Dense invisible text that pollutes copy-paste
    // ============================================
    const antiCopyText = securityText.repeat(20);

    // Horizontal dense pass — every 12px
    for (let y = 0; y < height; y += 12) {
      page.drawText(antiCopyText, {
        x: 0,
        y,
        size: 4,
        font: helveticaFont,
        color: rgb(1, 1, 1),
        opacity: 0.01,
      });
    }

    // Diagonal pass — 45 degree angle
    for (let y = -200; y < height + 200; y += 20) {
      page.drawText(antiCopyText, {
        x: 0,
        y,
        size: 3,
        font: helveticaFont,
        color: rgb(1, 1, 1),
        opacity: 0.01,
        rotate: degrees(45),
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Main export function called by UI
 */
export async function exportToMultiLayerPDF(options: PDFExportOptions) {
  let finalPdfBytes: Uint8Array;

  if (options.pdfBytesBase64) {
    // Mode A: User uploaded an existing PDF
    const base64Data = options.pdfBytesBase64.split(',')[1];
    const binaryStr = window.atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    finalPdfBytes = await applySecurityLayers(bytes, options);
    
  } else if (options.content) {
    // Mode B: User typed text — create basic PDF, then stamp layers
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 55;
    const contentWidth = pageWidth - margin * 2;

    // =============================================
    // COVER PAGE — matches Hooc AI sample exactly
    // =============================================

    // Embed logo image in cover page header
    let logoDataUrl: string | null = null;
    try {
      const logoRes = await fetch('/logo.jpeg');
      if (logoRes.ok) {
        const logoBlob = await logoRes.blob();
        logoDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(logoBlob);
        });
      }
    } catch (err) {
      console.error("Failed to load logo for cover page", err);
    }

    // Lavender header bar
    doc.setFillColor(200, 210, 240);
    doc.rect(0, 0, pageWidth, 75, 'F');

    // Logo in header (left side)
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'JPEG', 30, 12, 45, 45);
    }

    // Company name in header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 50, 100);
    doc.text('Hooc AI', 82, 35);

    // Tagline
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 80, 120);
    doc.text('Committed to Your', 82, 48);
    doc.text('Business Growth', 82, 57);

    // Contact info — right side of header
    doc.setFontSize(9);
    doc.setTextColor(40, 60, 100);
    doc.text('Visit us at : hooc.tech', pageWidth - 190, 28);
    doc.setTextColor(0, 120, 180);
    doc.text('Contact: +91 9627162135', pageWidth - 190, 42);
    doc.text('work@hooc.tech', pageWidth - 190, 56);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // "Exhibit A" centered (~25% from top)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Exhibit A', pageWidth / 2, 190, { align: 'center' });

    // "Software specifications"
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Software specifications', pageWidth / 2, 220, { align: 'center' });

    // Extract product name and prepared fields from content
    const contentLines = options.content.split('\n');
    let productName = '[Product Name]';
    let productDescription = '(FREEFORM PRODUCT FUNCTIONALITY DESCRIPTION)';
    let preparedForName = '[Client Name]';
    let preparedForCompany = '[Client Company]';
    let preparedByName = '[Your Name]';
    
    let inPreparedFor = false;
    let inPreparedBy = false;
    const preparedForLines: string[] = [];
    const preparedByLines: string[] = [];

    for (const line of contentLines) {
      const trimmed = line.trim();
      
      // Extract product name (first # heading that isn't "Exhibit A")
      if (trimmed.startsWith('# ') && !trimmed.includes('Exhibit')) {
        productName = trimmed.replace('# ', '').trim();
      }
      // Extract description
      if (trimmed.startsWith('## (')) {
        productDescription = trimmed.replace('## ', '').trim();
      }
      // Track Prepared for section
      if (trimmed === '**Prepared for:**') {
        inPreparedFor = true;
        inPreparedBy = false;
        continue;
      }
      if (trimmed === '**Prepared by:**') {
        inPreparedBy = true;
        inPreparedFor = false;
        continue;
      }
      // Collect values
      if (inPreparedFor && trimmed && !trimmed.startsWith('**') && !trimmed.startsWith('---') && !trimmed.startsWith('#')) {
        preparedForLines.push(trimmed);
      }
      if (inPreparedBy && trimmed && !trimmed.startsWith('**') && !trimmed.startsWith('---') && !trimmed.startsWith('#')) {
        preparedByLines.push(trimmed);
      }
      // Stop collecting at next section
      if ((inPreparedFor || inPreparedBy) && trimmed.startsWith('---')) {
        inPreparedFor = false;
        inPreparedBy = false;
      }
    }

    if (preparedForLines.length > 0) preparedForName = preparedForLines[0];
    if (preparedForLines.length > 1) preparedForCompany = preparedForLines[1];
    if (preparedByLines.length > 0) preparedByName = preparedByLines[0];

    // Product name — large, bold, centered (~48% from top)
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(productName, pageWidth / 2, pageHeight * 0.42, { align: 'center' });

    // Product description type — centered below name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const descLines = doc.splitTextToSize(productDescription, contentWidth - 60);
    let descY = pageHeight * 0.48;
    for (const dl of descLines) {
      doc.text(dl, pageWidth / 2, descY, { align: 'center' });
      descY += 22;
    }

    // "Prepared for / Prepared by" at bottom — two columns side by side
    const bottomY = pageHeight - 145;
    
    // Left column: Prepared for
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Prepared for:', margin, bottomY);
    doc.setFont('helvetica', 'normal');
    doc.text(preparedForName, margin, bottomY + 18);
    doc.text(preparedForCompany, margin, bottomY + 33);

    // Right column: Prepared by
    const rightCol = pageWidth * 0.55;
    doc.setFont('helvetica', 'bold');
    doc.text('Prepared by:', rightCol, bottomY);
    doc.setFont('helvetica', 'normal');
    doc.text(preparedByName, rightCol, bottomY + 18);
    doc.text('Hooc AI Technologies', rightCol, bottomY + 33);

    // Dark footer bar on cover page
    doc.setFillColor(50, 50, 50);
    doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');

    // =============================================
    // CONTENT PAGES (page 2 onwards)
    // =============================================
    doc.addPage();

    // Filter out cover page content (Exhibit A, product name header, prepared fields)
    // Start from "## 1." section
    let contentStartIndex = 0;
    for (let i = 0; i < contentLines.length; i++) {
      if (contentLines[i].match(/^## \d+\./)) {
        contentStartIndex = i;
        break;
      }
    }
    
    const bodyContent = contentLines.slice(contentStartIndex).join('\n');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(bodyContent, contentWidth);
    let yPos = margin + 50; // space for header logo

    let isCenterMode = false;

    for (let i = 0; i < lines.length; i++) {
      if (yPos > pageHeight - margin - 40) {
        doc.addPage();
        yPos = margin + 50;
      }
      
      const line = lines[i].trim();
      if (!line && !isCenterMode) {
        yPos += 15;
        continue;
      }

      // Center tags toggle state
      if (line.includes('<center>')) {
        isCenterMode = true;
        if (line === '<center>') continue;
      }
      if (line.includes('</center>')) {
        isCenterMode = false;
        if (line === '</center>') {
          yPos += 15;
          continue;
        }
      }

      const cleanLine = line.replace(/<center>|<\/center>/g, '').trim();
      if (!cleanLine) continue;

      const align = isCenterMode ? 'center' : 'left';
      const x = isCenterMode ? pageWidth / 2 : margin;

      // ### headings (Module level)
      if (cleanLine.startsWith('### ')) {
        yPos += 12;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanLine.replace('### ', ''), x, yPos, { align });
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
      }
      // ## headings (Section level)
      else if (cleanLine.startsWith('## ')) {
        yPos += 18;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanLine.replace('## ', '').toUpperCase(), x, yPos, { align });
        yPos += 6;
        // Draw underline
        doc.setDrawColor(180, 180, 180);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
      }
      // # headings (Title level)
      else if (cleanLine.startsWith('# ')) {
        yPos += 24;
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanLine.replace('# ', '').toUpperCase(), x, yPos, { align });
        yPos += 18;
        doc.setDrawColor(100, 100, 100);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
      }
      // --- horizontal rule
      else if (cleanLine === '---') {
        yPos += 8;
        doc.setDrawColor(180, 180, 180);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 12;
      }
      // **bold** lines
      else if (cleanLine.startsWith('**') && cleanLine.endsWith('**')) {
        doc.setFont('helvetica', 'bold');
        doc.text(cleanLine.replace(/\*\*/g, ''), x, yPos, { align });
        doc.setFont('helvetica', 'normal');
      }
      // **Key:** Value pattern
      else if (cleanLine.match(/^\*\*[^*]+:\*\*/)) {
        const match = cleanLine.match(/^\*\*([^*]+):\*\*\s*(.*)/);
        if (match) {
          doc.setFont('helvetica', 'bold');
          const key = `${match[1]}:`;
          const val = match[2] || '';
          
          if (isCenterMode) {
             doc.text(`${key} ${val}`, pageWidth/2, yPos, { align: 'center' });
          } else {
             doc.text(key, margin, yPos);
             const boldWidth = doc.getTextWidth(`${key} `);
             doc.setFont('helvetica', 'normal');
             doc.text(val, margin + boldWidth, yPos);
          }
        }
      }
      // Bullet points
      else if (cleanLine.startsWith('- ') || cleanLine.startsWith('• ')) {
        const bulletText = cleanLine.replace(/^[-•]\s*/, '');
        const bulletX = isCenterMode ? pageWidth / 2 : margin + 10;
        doc.text(`•  ${bulletText}`, bulletX, yPos, { align });
      }
      // Normal text
      else {
        doc.text(cleanLine, x, yPos, { align });
      }
      yPos += 15;
    }

    const rawPdfArrayBuffer = doc.output('arraybuffer');
    finalPdfBytes = await applySecurityLayers(new Uint8Array(rawPdfArrayBuffer), options);
    
  } else {
      throw new Error("No PDF or Content provided");
  }

  // Trigger download
  // @ts-expect-error TypeScript may not recognize Uint8Array as a BlobPart
  const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Hooc_AI_Secure_PRD.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

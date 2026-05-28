// HTML template for Quotation PDF generation
// Matches the exact Docstec quotation/invoice format

import { formatDateForPDF } from '../utils/formatters';

const formatAmount = (amount, currency = 'BDT') => {
  const numberFmt = Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  if (currency === 'BDT') return `৳ ${numberFmt}`;
  if (currency === 'USD') return `$ ${numberFmt}`;
  if (currency === 'GBP') return `£ ${numberFmt}`;
  if (currency === 'EUR') return `€ ${numberFmt}`;
  return `${currency} ${numberFmt}`;
};

export const generateQuotationHTML = (data) => {
  const {
    documentNo, date, validityDate,
    companyName, companyTagline, companyAddress, companyEmail, companyWeb,
    clientName, clientAddress, clientAttn,
    projectStartDate, deliveryTimeline,
    items = [], grossTotal, totalQty,
    advances = [], netDue, netDueInWords,
    termsAndConditions = [],
    signatureImageBase64,
    currency = 'BDT',
  } = data;

  const dateStr = formatDateForPDF(date);
  const validityStr = formatDateForPDF(validityDate);
  const startDateStr = formatDateForPDF(projectStartDate);
  const deliveryDateStr = formatDateForPDF(deliveryTimeline);

  // Build service items rows
  const itemRows = items.map((item, index) => {
    const descPoints = (item.description || [])
      .filter(d => d?.trim())
      .map(d => `<div class="desc-point">• ${d}</div>`)
      .join('');

    const exclusion = item.importantExclusion
      ? `<div class="exclusion">• <span class="exclusion-label">Important Exclusion:</span> ${item.importantExclusion}</div>`
      : '';

    return `
      <tr class="item-row">
        <td class="sl-cell">${String(item.sl || index + 1).padStart(2, '0')}</td>
        <td class="desc-cell">
          <div class="item-title">${item.title || ''}</div>
          <div class="desc-points">${descPoints}</div>
          ${exclusion}
        </td>
        <td class="qty-cell">${item.qty || 1}</td>
        <td class="amount-cell">${formatAmount(item.amount, currency)}</td>
      </tr>
    `;
  }).join('');

  // Build advance rows
  const advanceRows = advances
    .filter(a => a.amount > 0)
    .map(a => {
      const advDate = formatDateForPDF(a.date);
      return `
        <tr class="advance-row">
          <td class="sl-cell"></td>
          <td colspan="2" class="advance-label">
            <span class="advance-text">Less: ${a.label || 'Advance'}${advDate ? ` (Received ${advDate})` : ''}:</span>
          </td>
          <td class="amount-cell advance-amount">-${formatAmount(a.amount, currency)}</td>
        </tr>
      `;
    }).join('');

  // Build terms
  const termsHTML = termsAndConditions
    .filter(t => t.title?.trim() || t.body?.trim())
    .map(t => `
      <div class="term-item">
        • <strong>${t.title}:</strong> ${t.body}
      </div>
    `).join('');

  const signatureHTML = signatureImageBase64
    ? `<img src="${signatureImageBase64}" class="signature-img" />`
    : '<div class="signature-placeholder"></div>';

  const totalAdvanceAmount = advances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
  const calculatedTotalQty = totalQty || items.reduce((sum, item) => sum + (parseInt(item.qty) || 0), 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @page {
      margin: 0;
      size: A4;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      line-height: 1.5;
      background: #fff;
    }
    .page {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 40px 80px 0 80px; /* Top padding 40px, side padding 80px */
    }

    /* ===== HEADER ===== */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      border-bottom: 3px solid #1B2A4A;
      padding-bottom: 16px;
    }
    .header-left {
      flex: 1;
    }
    .company-name {
      font-size: 28px;
      font-weight: 800;
      color: #1B2A4A;
      letter-spacing: -0.5px;
    }
    .company-tagline {
      font-size: 9px;
      color: #666;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .header-right {
      text-align: right;
    }
    .doc-title {
      font-size: 22px;
      font-weight: 800;
      color: #1B2A4A;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-meta {
      font-size: 10px;
      color: #444;
      margin-top: 6px;
      line-height: 1.8;
    }
    .doc-meta strong {
      color: #1B2A4A;
    }

    /* ===== PARTIES ===== */
    .parties {
      display: flex;
      margin-bottom: 16px;
      gap: 32px;
    }
    .party {
      flex: 1;
    }
    .party-label {
      font-size: 9px;
      color: #2563EB;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
      border-left: 3px solid #2563EB;
      padding-left: 8px;
      margin-bottom: 8px;
    }
    .party-name {
      font-size: 14px;
      font-weight: 700;
      color: #1B2A4A;
      margin-bottom: 4px;
    }
    .party-detail {
      font-size: 10px;
      color: #555;
      line-height: 1.6;
    }

    /* ===== TIMELINE BAR ===== */
    .timeline-bar {
      display: flex;
      justify-content: space-between;
      background: #F0F4F8;
      border-radius: 6px;
      padding: 12px 20px;
      margin-bottom: 24px;
    }
    .timeline-item {
      font-size: 12px;
      color: #334155;
    }
    .timeline-label {
      color: #1B2A4A;
      font-weight: 700;
      margin-right: 6px;
    }

    /* ===== PREMIUM MINIMALIST TABLE ===== */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    thead th {
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      border-bottom: 1px solid #E2E8F0;
      color: #475569;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 12px;
      text-align: left;
    }
    thead th:nth-child(3),
    thead th:nth-child(4) {
      text-align: center;
    }
    .item-row {
      border-bottom: 1px solid #E2E8F0;
    }
    .sl-cell, .desc-cell, .qty-cell, .amount-cell {
      padding: 14px 12px;
      vertical-align: top;
    }
    .sl-cell {
      width: 40px;
      text-align: center;
      color: #64748B;
    }
    .qty-cell {
      width: 70px;
      text-align: center;
      font-weight: 600;
      color: #334155;
    }
    .amount-cell {
      width: 120px;
      text-align: right;
      font-weight: 600;
      color: #0F172A;
    }
    .item-title {
      font-size: 13px;
      font-weight: 600;
      color: #0F172A;
      margin-bottom: 4px;
    }
    .desc-points {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }
    .desc-point {
      margin-bottom: 2px;
    }
    .exclusion {
      margin-top: 6px;
      font-size: 11px;
      color: #EF4444;
    }
    .exclusion-label {
      font-weight: 600;
    }

    /* ===== TOTALS ===== */
    .gross-total-row td {
      padding: 12px;
      font-weight: 600;
      color: #0F172A;
    }
    .gross-total-label {
      text-align: right;
    }
    .advance-row td {
      padding: 8px 12px;
      color: #64748B;
    }
    .advance-label {
      text-align: right;
    }
    .advance-text, .advance-amount {
      color: #EF4444;
    }
    .net-due-row td {
      padding: 16px 12px;
      font-weight: 700;
      color: #0F172A;
    }
    .net-due-label {
      text-align: right;
    }

    /* ===== ELEGANT NET PAYABLE BOX ===== */
    .net-payable-table {
      width: 100%;
      margin-top: 16px;
      border-collapse: collapse;
      background: #F8FAFC;
      border-left: 4px solid #1B2A4A;
    }
    .net-payable-table td {
      padding: 16px 20px;
    }
    .net-payable-label {
      font-size: 13px;
      font-weight: 700;
      color: #475569;
    }
    .net-payable-value {
      font-size: 20px;
      font-weight: 700;
      color: #0F172A;
      text-align: right;
    }

    /* ===== NET DUE WORDS ===== */
    .due-words {
      margin: 16px 0 24px;
      font-size: 11px;
    }
    .due-words strong {
      color: #1B2A4A;
    }
    .due-words em {
      color: #16A34A;
      font-style: italic;
    }

    /* ===== TERMS ===== */
    .terms-title {
      font-size: 14px;
      font-weight: 800;
      color: #1B2A4A;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
      margin-top: 8px;
    }
    .terms-list {
      margin-bottom: 24px;
    }
    .term-item {
      font-size: 10px;
      color: #444;
      line-height: 1.7;
      margin-bottom: 8px;
    }
    .term-item strong {
      color: #1B2A4A;
    }

    /* ===== SIGNATURES ===== */
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      padding-top: 16px;
    }
    .sig-block {
      width: 45%;
    }
    .signature-img {
      height: 60px;
      margin-bottom: 8px;
      object-fit: contain;
    }
    .signature-placeholder {
      height: 60px;
      margin-bottom: 8px;
    }
    .sig-line {
      border-top: 1px solid #ccc;
      padding-top: 6px;
      font-size: 10px;
      color: #666;
    }
    .sig-name {
      font-size: 12px;
      font-weight: 700;
      color: #1B2A4A;
      margin-top: 4px;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <table style="width: 100%; border: none; border-collapse: collapse;">
    <thead>
      <tr><td style="height: 30mm; border: none;"></td></tr>
    </thead>
    <tbody>
      <tr><td style="border: none;">
        <div class="page">
          <!-- HEADER -->
          <div class="header">
            <div class="header-left">
        <div class="company-name">${companyName || 'Docstec'}.</div>
        <div class="company-tagline">${companyTagline || ''}</div>
      </div>
      <div class="header-right">
        <div class="doc-title">QUOTATION & INVOICE</div>
        <div class="doc-meta">
          <strong>Document No:</strong> ${documentNo}<br/>
          <strong>Date:</strong> ${dateStr}<br/>
          <strong>Validity:</strong> ${validityStr}
        </div>
      </div>
    </div>

    <!-- PARTIES -->
    <div class="parties">
      <div class="party">
        <div class="party-label">PREPARED BY</div>
        <div class="party-name">${companyName || 'Docstec'}</div>
        <div class="party-detail">
          ${companyAddress || ''}<br/>
          ${companyEmail ? `Email: ${companyEmail}` : ''}${companyEmail && companyWeb ? '<br/>' : ''}
          ${companyWeb ? `Web: ${companyWeb}` : ''}
        </div>
      </div>
      <div class="party">
        <div class="party-label">PREPARED FOR</div>
        <div class="party-name">${clientName || ''}</div>
        <div class="party-detail">
          ${clientAddress || ''}
          ${clientAttn ? `<br/>Attn: ${clientAttn}` : ''}
        </div>
      </div>
    </div>

    <!-- TIMELINE -->
    <div class="timeline-bar">
      <div class="timeline-item">
        <span class="timeline-label">Project Start Date:</span> ${startDateStr}
      </div>
      <div class="timeline-item">
        <span class="timeline-label">Delivery Date:</span> ${deliveryDateStr || 'TBD'}
      </div>
    </div>

    <!-- SCOPE OF WORK -->
    <div class="section-title">SCOPE OF WORK & COST BREAKDOWN</div>
    <table>
      <thead>
        <tr>
          <th>SL.</th>
          <th>DESCRIPTION OF SERVICES</th>
          <th>QTY</th>
          <th style="text-align:right">AMOUNT<br/>(${currency})</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}

        <!-- GROSS TOTAL -->
        <tr class="gross-total-row">
          <td class="sl-cell"></td>
          <td class="gross-total-label">Gross Project Valuation:</td>
          <td class="qty-cell" style="font-weight:700">${calculatedTotalQty}</td>
          <td class="amount-cell" style="font-weight:700">${formatAmount(grossTotal, currency)}</td>
        </tr>

        <!-- ADVANCES -->
        ${advanceRows}

        ${totalAdvanceAmount > 0 ? `
        <!-- NET DUE -->
        <tr class="net-due-row">
          <td class="sl-cell"></td>
          <td colspan="2" class="net-due-label">Net Outstanding Balance Due:</td>
          <td class="amount-cell net-due-amount">${formatAmount(netDue, currency)}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>

    <table class="net-payable-table">
      <tr>
        <td class="net-payable-label">NET PAYABLE AMOUNT:</td>
        <td class="net-payable-value">${formatAmount(netDue, currency)}</td>
      </tr>
    </table>

    ${totalAdvanceAmount > 0 && netDueInWords ? `
    <div class="due-words">
      <strong>Net Due Balance in Words:</strong> <em>${netDueInWords}</em>
    </div>
    ` : ''}

    <!-- TERMS -->
    ${termsAndConditions.length > 0 ? `
    <div class="terms-title">TERMS & CONDITIONS</div>
    <div class="terms-list">
      ${termsHTML}
    </div>
    ` : ''}

    <!-- SIGNATURES -->
    <div class="signatures">
      <div class="sig-block">
        ${signatureHTML}
        <div class="sig-line">Authorized Signature</div>
        <div class="sig-name">${companyName || 'Docstec'}</div>
      </div>
      <div class="sig-block">
        <div class="signature-placeholder"></div>
        <div class="sig-line">Accepted By (Signature & Date)</div>
        <div class="sig-name">${clientName || ''}</div>
      </div>
    </div>
        </div>
      </td></tr>
    </tbody>
    <tfoot>
      <tr><td style="height: 30mm; border: none;"></td></tr>
    </tfoot>
  </table>

</body>
</html>
  `;
};

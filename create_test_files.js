const fs = require('fs');
const path = require('path');
const XLSX = require('./frontend/node_modules/xlsx');

// 1. Create a dummy PDF file (just simple text formatted roughly as a PDF or standard text with PDF extension)
const pdfPath = path.join(__dirname, 'sample_test.pdf');
fs.writeFileSync(pdfPath, '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 45 >>\nstream\nBT /F1 24 Tf 100 700 Td (Sample Math Exam PDF) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n306\n%%EOF\n');
console.log('Created dummy PDF file:', pdfPath);

// 2. Create sample_answer_key.xlsx
const data = [
  { 'Câu': 'Câu 1', 'Đáp án': 'A' },
  { 'Câu': 'Câu 2', 'Đáp án': 'B' },
  { 'Câu': 'Câu 3', 'Đáp án': 'C' },
  { 'Câu': 'Câu 4', 'Đáp án': 'D' },
  { 'Câu': 'Câu 5', 'Đáp án': 'A' }
];

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

const xlsxPath = path.join(__dirname, 'sample_answer_key.xlsx');
XLSX.writeFile(workbook, xlsxPath);
console.log('Created sample Excel answer key:', xlsxPath);

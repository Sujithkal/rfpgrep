// Script to generate a test RFP PDF
// Run with: node generate-test-rfp.js

const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Create new PDF
const doc = new jsPDF();

// Title
doc.setFontSize(20);
doc.setFont(undefined, 'bold');
doc.text('REQUEST FOR PROPOSAL', 105, 20, { align: 'center' });
doc.text('IT Services RFP-2024-TEST', 105, 30, { align: 'center' });

doc.setFontSize(12);
doc.setFont(undefined, 'normal');
doc.text('Client: Test Corporation', 20, 45);
doc.text('Due Date: January 31, 2025', 20, 52);

// Line
doc.line(20, 58, 190, 58);

// Section 1
doc.setFontSize(14);
doc.setFont(undefined, 'bold');
doc.text('Section 1: Company Information', 20, 70);

doc.setFontSize(11);
doc.setFont(undefined, 'normal');
doc.text('Question 1.1:', 20, 82);
doc.text('Describe your company experience and history in delivering', 20, 89);
doc.text('enterprise software solutions.', 20, 96);

doc.text('Question 1.2:', 20, 110);
doc.text('What is your company background and years of experience?', 20, 117);

// Section 2
doc.setFontSize(14);
doc.setFont(undefined, 'bold');
doc.text('Section 2: Security & Compliance', 20, 135);

doc.setFontSize(11);
doc.setFont(undefined, 'normal');
doc.text('Question 2.1:', 20, 147);
doc.text('What security certifications does your company hold?', 20, 154);

doc.text('Question 2.2:', 20, 168);
doc.text('Describe your compliance certifications and auditing practices.', 20, 175);

// Section 3
doc.setFontSize(14);
doc.setFont(undefined, 'bold');
doc.text('Section 3: Pricing', 20, 193);

doc.setFontSize(11);
doc.setFont(undefined, 'normal');
doc.text('Question 3.1:', 20, 205);
doc.text('What is your pricing model and cost structure?', 20, 212);

doc.text('Question 3.2:', 20, 226);
doc.text('Provide details on your pricing terms and payment options.', 20, 233);

// Footer
doc.setFontSize(10);
doc.text('--- End of RFP Document ---', 105, 260, { align: 'center' });

// Save
const outputPath = path.join(__dirname, 'Test_RFP_Matching_Questions.pdf');
const pdfBuffer = doc.output('arraybuffer');
fs.writeFileSync(outputPath, Buffer.from(pdfBuffer));

console.log('PDF created successfully!');
console.log('Location:', outputPath);

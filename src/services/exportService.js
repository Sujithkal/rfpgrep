import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Footer, AlignmentType, PageBreak, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { notifyProjectExported } from './notificationService';

/**
 * Export project to PDF - Clean professional design
 */
export const exportToPDF = async (project) => {
    try {
        const doc = new jsPDF();
        const pageHeight = 280;
        const pageWidth = 210;
        const marginLeft = 20;
        const marginRight = 20;
        const contentWidth = pageWidth - marginLeft - marginRight;
        let yPosition = 25;

        // Colors - professional blue/gray scheme
        const primaryBlue = { r: 59, g: 130, b: 246 };
        const darkGray = { r: 31, g: 41, b: 55 };
        const lightGray = { r: 107, g: 114, b: 128 };

        // Check page break
        const checkPageBreak = (neededHeight) => {
            if (yPosition + neededHeight > pageHeight) {
                doc.addPage();
                yPosition = 25;
                return true;
            }
            return false;
        };

        // ========== TITLE PAGE ==========

        // Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
        const projectTitle = project?.name || 'RFP Response';
        const titleLines = doc.splitTextToSize(projectTitle, contentWidth);
        doc.text(titleLines, marginLeft, yPosition);
        yPosition += titleLines.length * 10 + 5;

        // Underline
        doc.setDrawColor(primaryBlue.r, primaryBlue.g, primaryBlue.b);
        doc.setLineWidth(1);
        doc.line(marginLeft, yPosition, marginLeft + 40, yPosition);
        yPosition += 15;

        // Metadata
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);

        if (project?.client) {
            doc.text(`Client: ${project.client}`, marginLeft, yPosition);
            yPosition += 7;
        }
        doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, marginLeft, yPosition);
        yPosition += 7;

        // Stats
        let totalQ = 0, answeredQ = 0;
        project?.sections?.forEach(s => s.questions?.forEach(q => { totalQ++; if (q.response) answeredQ++; }));
        doc.text(`Questions: ${answeredQ} of ${totalQ} answered`, marginLeft, yPosition);
        yPosition += 20;

        // ========== TABLE OF CONTENTS ==========
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
        doc.text('Contents', marginLeft, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        project?.sections?.forEach((section, idx) => {
            doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
            doc.text(`${idx + 1}. ${section.title || section.name || 'Section'}`, marginLeft + 5, yPosition);
            doc.setTextColor(lightGray.r, lightGray.g, lightGray.b);
            doc.text(`${section.questions?.length || 0} questions`, pageWidth - marginRight, yPosition, { align: 'right' });
            yPosition += 6;
        });

        // ========== SECTIONS ==========
        let globalQ = 0;

        project?.sections?.forEach((section, sectionIdx) => {
            doc.addPage();
            yPosition = 25;

            // Section header
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryBlue.r, primaryBlue.g, primaryBlue.b);
            doc.text(`Section ${sectionIdx + 1}: ${section.title || section.name || 'Questions'}`, marginLeft, yPosition);
            yPosition += 3;

            // Section underline
            doc.setDrawColor(primaryBlue.r, primaryBlue.g, primaryBlue.b);
            doc.setLineWidth(0.5);
            doc.line(marginLeft, yPosition, pageWidth - marginRight, yPosition);
            yPosition += 15;

            // Questions
            section.questions?.forEach((question) => {
                globalQ++;

                const questionText = question.text || 'Question';
                const responseText = question.response || '';
                const splitQ = doc.splitTextToSize(questionText, contentWidth - 10);
                const splitR = responseText ? doc.splitTextToSize(responseText, contentWidth - 15) : [];
                const estimatedHeight = (splitQ.length * 5) + (splitR.length * 5) + 25;

                checkPageBreak(Math.min(estimatedHeight, 60));

                // Question number and text
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(darkGray.r, darkGray.g, darkGray.b);
                doc.text(`${globalQ}.`, marginLeft, yPosition);
                doc.text(splitQ, marginLeft + 10, yPosition);
                yPosition += splitQ.length * 5 + 5;

                // Response
                if (responseText) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(50, 50, 50);

                    // Left border line
                    const responseHeight = splitR.length * 5 + 2;
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.5);
                    doc.line(marginLeft + 8, yPosition - 2, marginLeft + 8, yPosition + responseHeight);

                    doc.text(splitR, marginLeft + 15, yPosition);
                    yPosition += responseHeight + 8;
                } else {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(150, 150, 150);
                    doc.text('No response provided', marginLeft + 15, yPosition);
                    yPosition += 12;
                }

                yPosition += 5;
            });
        });

        // Page numbers
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
        }

        // Save
        const safeName = (project?.name || 'rfp_response').replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
        doc.save(`${safeName}.pdf`);
        return `${safeName}.pdf`;
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Error exporting PDF: ' + error.message);
        throw error;
    }
};

/**
 * Export project to Word document - Clean professional design
 */
export const exportToWord = async (project) => {
    const children = [];

    // Stats
    let totalQ = 0, answeredQ = 0;
    project?.sections?.forEach(s => s.questions?.forEach(q => { totalQ++; if (q.response) answeredQ++; }));

    // Title
    children.push(new Paragraph({
        children: [new TextRun({ text: project.name || 'RFP Response', bold: true, size: 48, color: '1F2937' })],
        spacing: { after: 200 },
    }));

    // Metadata
    if (project.client) {
        children.push(new Paragraph({
            children: [new TextRun({ text: `Client: ${project.client}`, size: 24, color: '6B7280' })],
            spacing: { after: 100 },
        }));
    }
    children.push(new Paragraph({
        children: [new TextRun({ text: `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, size: 24, color: '6B7280' })],
        spacing: { after: 100 },
    }));
    children.push(new Paragraph({
        children: [new TextRun({ text: `Questions: ${answeredQ} of ${totalQ} answered`, size: 24, color: '6B7280' })],
        spacing: { after: 400 },
    }));

    // Sections
    let globalQ = 0;

    project.sections?.forEach((section, sectionIdx) => {
        // Page break before section (except first)
        if (sectionIdx > 0) {
            children.push(new Paragraph({ children: [new PageBreak()] }));
        }

        // Section header
        children.push(new Paragraph({
            children: [new TextRun({ text: `Section ${sectionIdx + 1}: ${section.title || section.name || 'Questions'}`, bold: true, size: 28, color: '3B82F6' })],
            border: { bottom: { color: '3B82F6', size: 6, style: BorderStyle.SINGLE } },
            spacing: { before: 200, after: 300 },
        }));

        // Questions
        section.questions?.forEach((question) => {
            globalQ++;
            const questionText = question.text || 'Question';
            const responseText = question.response || '';

            // Question
            children.push(new Paragraph({
                children: [
                    new TextRun({ text: `${globalQ}. `, bold: true, size: 24, color: '1F2937' }),
                    new TextRun({ text: questionText, bold: true, size: 24, color: '1F2937' }),
                ],
                spacing: { before: 200, after: 100 },
            }));

            // Response
            if (responseText) {
                children.push(new Paragraph({
                    children: [new TextRun({ text: responseText, size: 22, color: '374151' })],
                    border: { left: { color: 'D1D5DB', size: 12, style: BorderStyle.SINGLE } },
                    indent: { left: 300 },
                    spacing: { after: 200 },
                }));
            } else {
                children.push(new Paragraph({
                    children: [new TextRun({ text: 'No response provided', italics: true, size: 22, color: '9CA3AF' })],
                    indent: { left: 300 },
                    spacing: { after: 200 },
                }));
            }
        });
    });

    const doc = new Document({
        sections: [{ properties: {}, children: children }],
    });

    // Save
    const blob = await Packer.toBlob(doc);
    const safeName = (project.name || 'rfp_response').replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
    saveAs(blob, `${safeName}.docx`);
    return `${safeName}.docx`;
};

/**
 * Export summary statistics
 */
export const getExportStats = (project) => {
    let totalQuestions = 0, answeredQuestions = 0;
    project.sections?.forEach(section => {
        section.questions?.forEach(q => { totalQuestions++; if (q.response) answeredQuestions++; });
    });
    return {
        totalQuestions,
        answeredQuestions,
        completionRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
    };
};

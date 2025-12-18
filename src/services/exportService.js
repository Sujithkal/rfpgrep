import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export project to PDF
 */
export const exportToPDF = (project) => {
    console.log('exportToPDF called with project:', project);
    console.log('Project name:', project?.name);

    try {
        const doc = new jsPDF();
        let yPosition = 20;
        const pageHeight = 280;
        const marginLeft = 20;
        const lineHeight = 7;

        // Helper to check page break
        const checkPageBreak = (neededHeight) => {
            if (yPosition + neededHeight > pageHeight) {
                doc.addPage();
                yPosition = 20;
            }
        };

        // Title
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(project?.name || 'Proposal Response', marginLeft, yPosition);
        yPosition += 12;

        // Metadata
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        if (project?.client) {
            doc.text(`Client: ${project.client}`, marginLeft, yPosition);
            yPosition += 6;
        }
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, marginLeft, yPosition);
        yPosition += 15;
        doc.setTextColor(0);

        // Sections
        if (project?.sections) {
            project.sections.forEach((section, sectionIndex) => {
                checkPageBreak(20);

                // Section Header
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(59, 130, 246);
                doc.text(`Section ${sectionIndex + 1}: ${section.title || section.name || 'Questions'}`, marginLeft, yPosition);
                yPosition += 10;
                doc.setTextColor(0);

                // Questions
                if (section.questions) {
                    section.questions.forEach((question, qIndex) => {
                        checkPageBreak(40);

                        doc.setFontSize(11);
                        doc.setFont('helvetica', 'bold');
                        const questionText = `${sectionIndex + 1}.${qIndex + 1}. ${question.text || 'Question'}`;
                        const splitQuestion = doc.splitTextToSize(questionText, 170);
                        doc.text(splitQuestion, marginLeft, yPosition);
                        yPosition += splitQuestion.length * lineHeight + 3;

                        if (question.response) {
                            doc.setFont('helvetica', 'normal');
                            doc.setFontSize(10);
                            const splitResponse = doc.splitTextToSize(question.response, 170);
                            const responseHeight = splitResponse.length * 5;
                            checkPageBreak(responseHeight);
                            doc.text(splitResponse, marginLeft, yPosition);
                            yPosition += splitResponse.length * 5 + 5;
                        } else {
                            doc.setFont('helvetica', 'italic');
                            doc.setTextColor(150);
                            doc.text('[No response provided]', marginLeft, yPosition);
                            doc.setTextColor(0);
                            yPosition += 8;
                        }

                        yPosition += 5;
                    });
                }

                yPosition += 10;
            });
        }

        // Save with proper filename
        const safeName = (project?.name || 'proposal').replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_') || 'proposal';
        const filename = `${safeName}_response.pdf`;
        console.log('Saving PDF with filename:', filename);
        doc.save(filename);
        console.log('PDF save completed');
        return filename;
    } catch (error) {
        console.error('PDF export error:', error);
        alert('Error exporting PDF: ' + error.message);
        throw error;
    }
};

/**
 * Export project to Word document
 */
export const exportToWord = async (project) => {
    const children = [];

    // Title
    children.push(
        new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [
                new TextRun({
                    text: project.name || 'Proposal Response',
                    bold: true,
                    size: 48,
                }),
            ],
        })
    );

    // Metadata
    if (project.client) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Client: ${project.client}`,
                        color: '666666',
                        size: 22,
                    }),
                ],
            })
        );
    }

    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `Generated: ${new Date().toLocaleDateString()}`,
                    color: '666666',
                    size: 22,
                }),
            ],
            spacing: { after: 400 },
        })
    );

    // Sections
    if (project.sections) {
        project.sections.forEach((section, sectionIndex) => {
            // Section Header
            children.push(
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [
                        new TextRun({
                            text: `Section ${sectionIndex + 1}: ${section.title || 'Questions'}`,
                            bold: true,
                            color: '3B82F6',
                        }),
                    ],
                    spacing: { before: 400, after: 200 },
                })
            );

            // Questions
            if (section.questions) {
                section.questions.forEach((question, qIndex) => {
                    // Question
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${sectionIndex + 1}.${qIndex + 1}. ${question.text || 'Question'}`,
                                    bold: true,
                                    size: 24,
                                }),
                            ],
                            spacing: { before: 200 },
                        })
                    );

                    // Response
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: question.response || '[No response provided]',
                                    italics: !question.response,
                                    color: question.response ? '000000' : '999999',
                                    size: 22,
                                }),
                            ],
                            spacing: { after: 200 },
                        })
                    );
                });
            }
        });
    }

    // Create document
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: children,
            },
        ],
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    const safeName = (project.name || 'proposal').replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_');
    const filename = `${safeName}_response.docx`;
    saveAs(blob, filename);
    return filename;
};

/**
 * Export summary statistics
 */
export const getExportStats = (project) => {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    if (project.sections) {
        project.sections.forEach(section => {
            section.questions?.forEach(question => {
                totalQuestions++;
                if (question.response) {
                    answeredQuestions++;
                }
            });
        });
    }

    return {
        totalQuestions,
        answeredQuestions,
        completionRate: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
    };
};

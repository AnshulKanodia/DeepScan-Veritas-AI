import io
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.api.schemas import ForensicReportRequest

def generate_forensic_pdf(report_data: ForensicReportRequest) -> io.BytesIO:
    """
    Generates an in-memory PDF Forensic Audit Report using ReportLab.
    Streams back as BytesIO with zero storage cost.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Forensic Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=14
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=8
    )
    
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    
    code_snippet_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B')
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("VERITAS AI / DEEPSCAN FORENSIC AUDIT REPORT", title_style))
    utc_now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    story.append(Paragraph(
        f"Generated: {utc_now} | Type: {report_data.content_type.upper()} | Integrity Verification System",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#CBD5E1'), spaceAfter=14))

    # Executive Verdict Box
    verdict_color = colors.HexColor('#DC2626') if report_data.overall_ai_score >= 70 else (
        colors.HexColor('#16A34A') if report_data.overall_ai_score <= 35 else colors.HexColor('#D97706')
    )
    
    summary_data = [
        [
            Paragraph("<b>Overall AI Probability:</b>", body_style),
            Paragraph(f"<font color='{verdict_color.hexval()}'><b>{report_data.overall_ai_score:.1f}% ({report_data.verdict})</b></font>", body_style)
        ],
        [
            Paragraph("<b>Forensic SHA-256 Hash:</b>", body_style),
            Paragraph(f"<font face='Courier' size='7'>{report_data.forensic_hash}</font>", body_style)
        ]
    ]

    if report_data.content_type == "text":
        summary_data.append([
            Paragraph("<b>Mean Perplexity (PPL):</b>", body_style),
            Paragraph(f"{report_data.mean_perplexity or 'N/A'}", body_style)
        ])
        summary_data.append([
            Paragraph("<b>Burstiness Index:</b>", body_style),
            Paragraph(f"{report_data.burstiness_score or 'N/A'}", body_style)
        ])
    else:
        summary_data.append([
            Paragraph("<b>AST Maximum Depth:</b>", body_style),
            Paragraph(f"{report_data.ast_max_depth or 'N/A'}", body_style)
        ])
        summary_data.append([
            Paragraph("<b>Identifier Entropy:</b>", body_style),
            Paragraph(f"{report_data.identifier_entropy or 'N/A'} bits", body_style)
        ])

    summary_table = Table(summary_data, colWidths=[150, 390])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # Inspected Sample Section
    story.append(Paragraph("Audited Content Extract", section_style))
    sample_text = report_data.content[:1500] + ("..." if len(report_data.content) > 1500 else "")
    story.append(Paragraph(sample_text.replace("\n", "<br/>"), code_snippet_style if report_data.content_type == "code" else body_style))
    story.append(Spacer(1, 14))

    # Methodology Footnote
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=8))
    footnote = (
        "<b>Forensic Methodology:</b> Analysis is conducted using local statistical feature extraction: "
        "linguistic perplexity, burstiness variance (Fano factor), and syntax tree structural entropy. "
        "This report is cryptographically tied to the provided SHA-256 payload."
    )
    story.append(Paragraph(footnote, ParagraphStyle('Footnote', parent=body_style, fontSize=7, leading=10, textColor=colors.HexColor('#94A3B8'))))

    doc.build(story)
    buffer.seek(0)
    return buffer

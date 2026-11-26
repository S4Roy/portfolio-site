"""Export the Markdown CV to a selectable-text PDF. Requires reportlab."""
from pathlib import Path
from html import escape
import re
import shutil

import reportlab
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/Subhankar_Roy_ATS_Resume.md'
OUTPUT = ROOT / 'assets/Subhankar_Roy_Full_Stack_Developer_Resume.pdf'

# Embed regular and bold faces so emphasis renders consistently in PDF viewers.
font_root = Path('/System/Library/Fonts/Supplemental')
if (font_root / 'Arial.ttf').exists():
    regular_font = font_root / 'Arial.ttf'
    bold_font = font_root / 'Arial Bold.ttf'
else:
    font_root = Path(reportlab.__file__).parent / 'fonts'
    regular_font = font_root / 'Vera.ttf'
    bold_font = font_root / 'VeraBd.ttf'
pdfmetrics.registerFont(TTFont('ResumeSans', str(regular_font)))
pdfmetrics.registerFont(TTFont('ResumeSans-Bold', str(bold_font)))
pdfmetrics.registerFontFamily('ResumeSans', normal='ResumeSans', bold='ResumeSans-Bold')

styles = {
    'name': ParagraphStyle('Name', fontName='ResumeSans-Bold', fontSize=20, leading=23, spaceAfter=5),
    'section': ParagraphStyle('Section', fontName='ResumeSans-Bold', fontSize=10.5, leading=13, spaceBefore=9, spaceAfter=4, keepWithNext=True, textColor=colors.HexColor('#1e3a8a')),
    'role': ParagraphStyle('Role', fontName='ResumeSans-Bold', fontSize=10, leading=13, spaceBefore=6, spaceAfter=3, keepWithNext=True),
    'body': ParagraphStyle('Body', fontName='ResumeSans', fontSize=10, leading=13, spaceAfter=3, alignment=TA_LEFT),
    'bullet': ParagraphStyle('Bullet', fontName='ResumeSans', fontSize=10, leading=13, leftIndent=10, firstLineIndent=-8, spaceAfter=2),
    'headline': ParagraphStyle('Headline', fontName='ResumeSans-Bold', fontSize=11, leading=14, spaceAfter=4, textColor=colors.HexColor('#1d4ed8')),
    'meta': ParagraphStyle('Meta', fontName='ResumeSans', fontSize=9.5, leading=12.5, spaceAfter=3, keepWithNext=True),
}

def linked_plain(text):
    # Keep project names readable while retaining clickable URL annotations.
    pattern = re.compile(r'\[([^\]]+)\]\((https?://[^\s)]+)\)|(https?://[^\s]+)')
    parts = []
    cursor = 0
    for match in pattern.finditer(text):
        parts.append(escape(text[cursor:match.start()]))
        label = match.group(1) or match.group(3)
        url = match.group(2) or match.group(3)
        parts.append('<link href="' + escape(url, quote=True) + '" color="#1d4ed8">' + escape(label) + '</link>')
        cursor = match.end()
    parts.append(escape(text[cursor:]))
    return ''.join(parts)

def linked(text):
    parts = re.split(r'(\*\*.*?\*\*)', text)
    return ''.join('<b>' + linked_plain(part[2:-2]) + '</b>'
                   if part.startswith('**') and part.endswith('**')
                   else linked_plain(part) for part in parts)

story = []
previous_role = False
for line in SOURCE.read_text().splitlines():
    if not line.strip():
        continue
    if line.startswith('# '):
        key, text = 'name', line[2:]
    elif line.startswith('## '):
        key, text = 'section', line[3:]
    elif line.startswith('### '):
        key, text = 'role', line[4:]
    elif line.startswith('- '):
        key, text = 'bullet', '• ' + line[2:]
    else:
        key = 'headline' if line.startswith('Senior Full Stack Developer |') else 'meta' if previous_role or line.startswith(('Employer transition:', 'Website:', 'Android app:', 'LinkedIn:', 'Kolkata,', 'Full Stack Developer |', 'Senior Full Stack Developer |')) else 'body'
        text = line
    story.append(Paragraph(linked(text), styles[key]))
    if key == 'section':
        story.append(HRFlowable(width='100%', thickness=0.6, color=colors.HexColor('#c7d2e5'), spaceBefore=0, spaceAfter=4))
    previous_role = key == 'role'

OUTPUT.parent.mkdir(exist_ok=True)
doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=40, leftMargin=40, topMargin=32, bottomMargin=32, title='Subhankar Roy - Senior Full Stack Developer - Node.js, React, Next.js, Angular', subject='Resume', keywords='Senior Full Stack Developer, Node.js, TypeScript, React, Next.js, Angular, MongoDB, MERN, MEAN', author='Subhankar Roy')
doc.build(story)
shutil.copyfile(OUTPUT, ROOT / 'public/Subhankar_Roy_Full_Stack_Developer_Resume.pdf')
print(f'Updated {OUTPUT} and public download.')

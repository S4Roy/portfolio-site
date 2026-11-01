"""Export the Markdown CV to an editable, single-column Word document."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
import xml.etree.ElementTree as ET
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'docs/Subhankar_Roy_ATS_Resume.md'
OUTPUT = SOURCE.with_suffix('.docx')
paragraphs = []
expected = []
relationships = []
link_pattern = re.compile(r'\[([^\]]+)\]\((https?://[^\s)]+)\)|(https?://[^\s]+)')

def runs(text, size, bold):
    def run(value, emphasis=False, hyperlink=False):
        formatting = ('<w:b/>' if bold or emphasis else '') + ('<w:color w:val="16305C"/><w:u w:val="single"/>' if hyperlink else '')
        return (f'<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>'
                f'<w:sz w:val="{size}"/>{formatting}</w:rPr>'
                f'<w:t xml:space="preserve">{escape(value)}</w:t></w:r>')
    parts = []
    visible = []
    for segment in re.split(r'(\*\*.*?\*\*)', text):
        emphasis = segment.startswith('**') and segment.endswith('**')
        if emphasis:
            segment = segment[2:-2]
        cursor = 0
        for match in link_pattern.finditer(segment):
            prefix = segment[cursor:match.start()]
            parts.append(run(prefix, emphasis))
            label = match.group(1) or match.group(3)
            url = match.group(2) or match.group(3)
            relationship_id = f'rId{len(relationships) + 1}'
            relationships.append((relationship_id, url))
            parts.append(f'<w:hyperlink r:id="{relationship_id}">' + run(label, emphasis, True) + '</w:hyperlink>')
            visible.extend([prefix, label])
            cursor = match.end()
        parts.append(run(segment[cursor:], emphasis))
        visible.append(segment[cursor:])
    expected.append(''.join(visible))
    return ''.join(parts)

for line in SOURCE.read_text().splitlines():
    if not line.strip():
        continue
    heading = line.startswith('#')
    size = 32 if line.startswith('# ') else 22 if line.startswith('## ') else 21
    text = line.lstrip('# ') if heading else line
    bullet = text.startswith('- ')
    if bullet:
        text = '• ' + text[2:]
    props = '<w:keepNext/>' if heading else ''
    if bullet:
        props += '<w:ind w:left="180" w:hanging="180"/>'
    paragraphs.append(
        f'<w:p><w:pPr>{props}<w:spacing w:before="{120 if heading else 60}" w:after="40"/>'
        f'</w:pPr>' + runs(text, size, heading) + '</w:p>'
    )

xml = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
       '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
       '<w:body>' + ''.join(paragraphs) + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
       '<w:pgMar w:top="720" w:right="864" w:bottom="720" w:left="864"/>'
       '</w:sectPr></w:body></w:document>')
with ZipFile(OUTPUT, 'w', ZIP_DEFLATED) as archive:
    archive.writestr('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
    archive.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
    archive.writestr('word/document.xml', xml)
    archive.writestr('word/_rels/document.xml.rels',
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        ''.join(f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="{escape(url, {chr(34): "&quot;"})}" TargetMode="External"/>' for rid, url in relationships) + '</Relationships>')
with ZipFile(OUTPUT) as archive:
    assert archive.testzip() is None
    root = ET.fromstring(archive.read('word/document.xml'))
    texts = [''.join(element.itertext()) for element in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')]
    assert texts == expected
print(f'Updated and verified {OUTPUT}')

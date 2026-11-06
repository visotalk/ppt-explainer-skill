"""Extract PPTX/PDF structure. PDFium renders reference pages; no cloud uploads."""
import argparse
import hashlib
import json
import re
from pathlib import Path

from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE
from pypdf import PdfReader
import pypdfium2 as pdfium


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def selected_pages(spec, count):
    pages = []
    for item in spec.split(','):
        if not re.fullmatch(r'\d+(-\d+)?', item):
            raise ValueError('Invalid page range')
        parts = list(map(int, item.split('-')))
        start, end = parts[0], parts[-1]
        if start < 1 or end > count or end < start:
            raise ValueError(f'Page range outside 1–{count}')
        pages.extend(range(start, end + 1))
    return list(dict.fromkeys(pages))


def extract(source, work, pages_spec, reference_pdf):
    pages_dir = work / 'extracted/pages'
    assets_dir = work / 'extracted/assets'
    pages_dir.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(parents=True, exist_ok=True)
    warnings, pages, fonts, colors = [], [], set(), set()
    is_pptx = source.suffix.lower() == '.pptx'
    presentation = Presentation(source) if is_pptx else None
    reader = None if is_pptx else PdfReader(source)
    count = len(presentation.slides) if is_pptx else len(reader.pages)
    chosen = selected_pages(pages_spec, count)
    pdf = pdfium.PdfDocument(str(reference_pdf or source))
    if len(pdf) != count:
        raise ValueError(f'Rendered page count {len(pdf)} differs from source {count}')

    def shape_objects(shapes, page_num, parent=None):
        result = []
        for shape in shapes:
            oid = f'page-{page_num}-object-{shape.shape_id}'
            obj = {'id': oid, 'type': 'shape', 'name': shape.name,
                   'bounds': {'x': shape.left, 'y': shape.top, 'width': shape.width, 'height': shape.height},
                   'parentId': parent, 'text': ''}
            if shape.has_text_frame:
                obj['text'] = shape.text
                for paragraph in shape.text_frame.paragraphs:
                    for run in paragraph.runs:
                        if run.font.name:
                            fonts.add(run.font.name)
                        try:
                            if run.font.color.rgb:
                                colors.add('#' + str(run.font.color.rgb))
                        except (AttributeError, TypeError):
                            pass
            if shape.has_table:
                obj['type'] = 'table'
                obj['rows'] = [[c.text for c in row.cells] for row in shape.table.rows]
                obj['text'] = '\n'.join(' | '.join(row) for row in obj['rows'])
            if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                image = shape.image
                asset = assets_dir / f'{oid}.{image.ext}'
                asset.write_bytes(image.blob)
                obj.update(type='image', asset=str(asset.relative_to(work)))
            if shape.has_chart:
                obj['type'] = 'chart'
                try:
                    obj['chart'] = {'categories': [c.label for c in shape.chart.plots[0].categories],
                                    'series': [{'name': s.name, 'values': list(s.values)} for s in shape.chart.series]}
                except (ValueError, AttributeError, TypeError) as error:
                    warnings.append(f'{oid}: chart extraction incomplete ({type(error).__name__}); use page image.')
            result.append(obj)
            if shape.shape_type == MSO_SHAPE_TYPE.GROUP:
                obj['type'] = 'group'
                obj['childCoordinateSystem'] = 'group-local EMU; transforms are not flattened'
                warnings.append(f'{oid}: group geometry requires transform; reference page is authoritative.')
                result.extend(shape_objects(shape.shapes, page_num, oid))
        return result

    for number in chosen:
        page = pdf[number - 1]
        image_path = pages_dir / f'page-{number}.png'
        bitmap = page.render(scale=1600 / page.get_width())
        bitmap.to_pil().convert('RGB').save(image_path)
        if is_pptx:
            slide = presentation.slides[number - 1]
            objects = shape_objects(slide.shapes, number)
            text = '\n'.join(o['text'] for o in objects if o['text'])
            title = slide.shapes.title.text if slide.shapes.title else next(iter(text.splitlines()), f'Page {number}')
            notes = slide.notes_slide.notes_text_frame.text if slide.has_notes_slide else ''
            canvas = {'width': presentation.slide_width, 'height': presentation.slide_height, 'units': 'EMU', 'origin': 'top-left'}
        else:
            source_page = reader.pages[number - 1]
            text = source_page.extract_text() or ''
            title = next((line.strip() for line in text.splitlines() if line.strip()), f'Page {number}')
            objects = []
            notes = ''
            canvas = {'width': float(source_page.mediabox.width), 'height': float(source_page.mediabox.height), 'units': 'pt', 'origin': 'bottom-left'}
            if not text.strip():
                warnings.append(f'Page {number}: no extractable text. OCR is required and not implemented in this MVP.')
        pages.append({'id': f'page-{number}', 'number': number, 'title': title.strip(), 'text': text,
                      'notes': notes, 'canvas': canvas, 'image': str(image_path.relative_to(work)), 'objects': objects})
        bitmap.close()
        page.close()
    pdf.close()
    if is_pptx:
        warnings.append('PPTX previews are rendered by LibreOffice; original fonts and complex objects may differ. Object colors do not fully resolve theme inheritance.')
    else:
        warnings.append('PDF MVP extracts page text and renders pages; editable object geometry and chart recovery are not implemented.')
    doc = {'schemaVersion': 1, 'source': {'path': str(source.relative_to(work)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
           'format': source.suffix.lower()[1:], 'pageCount': count}, 'selectedPages': chosen, 'pages': pages, 'warnings': warnings}
    save(work / 'extracted/document.json', doc)
    save(work / 'extracted/style.json', {'schemaVersion': 1, 'fonts': sorted(fonts), 'textColors': sorted(colors),
         'strategy': 'Preserve rendered source pages; host typography uses bundled Noto Sans CJK SC.', 'warnings': warnings})
    print(json.dumps({'pages': chosen, 'pageCount': count, 'warnings': warnings}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--work', type=Path, required=True)
    parser.add_argument('--pages', required=True)
    parser.add_argument('--reference-pdf', type=Path)
    args = parser.parse_args()
    extract(args.source, args.work, args.pages, args.reference_pdf)

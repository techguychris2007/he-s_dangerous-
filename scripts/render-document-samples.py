from pathlib import Path
import pypdfium2 as pdfium
from pypdf import PdfReader
out = Path('output/pdf')
for name in ['darkworld-sample-certificate', 'darkworld-sample-report']:
    source = out / (name + '.pdf')
    reader = PdfReader(source)
    assert all(page.extract_text().strip() for page in reader.pages)
    doc = pdfium.PdfDocument(str(source))
    for index, page in enumerate(doc):
        page.render(scale=1.3).to_pil().save(out / f'{name}-{index + 1}.png')
    print(name, len(reader.pages), 'pages rendered')

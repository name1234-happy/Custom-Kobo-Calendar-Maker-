# Kobo Calendar Maker v6

This version fixes the Kobo PDF layout and adds customizable month tabs.

## Included fixes
- Background colour is painted onto every exported PDF page, so it does not disappear on Kobo.
- Monthly overview uses a responsive grid that fits inside the selected page size and avoids overlapping boxes.
- Every monthly overview has an **Open Week Overview** button.
- Special Dates (Holiday/Event) appear in the monthly overview, weekly overview, daily page and saved JSON.
- Holiday and Event colours are independently customizable.
- All 12 month tab colours are individually customizable.
- Month tabs appear on Monthly, Weekly, Daily and Retrospective pages.
- Month tabs in the PDF link back to the matching monthly overview when monthly pages are enabled.
- Save Design creates an editable JSON file; Load Design restores it so editing can continue.
- Date boxes in the monthly PDF link to the corresponding daily page when daily pages are enabled.

## Kobo
For the Kobo Libra Colour, the designer starts with 1264 x 1680. Set your desired PPI before exporting if you need a particular physical PDF page size.

## GitHub Pages
Upload `index.html`, `style.css`, and `app.js` to your GitHub Pages repository.


## Preview = PDF
The PDF exporter now captures the same HTML page used by the Live preview. Changes to colours, sections, Special Dates, month tabs, and page layout are therefore reflected in the exported pages instead of being recreated by a separate drawing system.

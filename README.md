# Dummy Comm Test Comparison

A browser version of the **234Comparison** and **634Comparison** sheets of
`Dummy_Comm_Comparison_Spreadsheet.xlsx`. It shows the same comparison (test details and
the three charts for each grade) with a sortable, searchable test list, and needs no Excel,
macros or any other software.

The workbook stays the place where test data lives. The page reads its
`Grade_234_TestData` and `Grade_634_TestData` sheets directly, so you keep adding tests
there exactly as before.

## Using it

1. Copy `Comm_Comparison.html` anywhere: your desktop, a shared drive, or an email
   attachment. It's a single file with no external libraries and needs no internet
   connection.
2. Double-click it. It opens in Chrome, Edge, Firefox or Safari (any recent version).
3. Click **Open data file…** (or drag the file onto the page) and choose the workbook,
   or a CSV export of one of the two data sheets. The file is read inside the browser
   and **never uploaded anywhere**. The first time, each grade starts with the five tests
   chosen on its comparison sheet.
4. Switch between **234** and **634** at the top. Each grade keeps its own tests.
5. Pick tests. **There is no limit**: compare as many as you like.
   * Type a test number into a slot (*Test 1*, *Test 2* …), or pick one from the
     drop-down suggestions, the same as the *Choose Test # From Table* cells. Press
     **Enter** on the last slot to open another one.
   * Paste or type several numbers into one slot (`26029 26030, 26031`) and press
     **Enter**: they fill that slot and the ones after it, adding slots as needed.
   * Click a test in the **test list** on the right to put it in the highlighted slot
     (a new slot if they are all full). Click it again to take it out.
   * Filter the test list and click **+ Add all shown** (or press **Enter** in the filter
     box) to add every test shown, for example a whole lot or every test from `2026-09`.
   * **+ Add test** adds an empty slot; **×** clears one; **Clear all** starts again.
6. The test list starts with the newest tests first. Sort it with the buttons above it
   (click the same button again to reverse the order). The filter box searches the
   listed columns and the comments, for example `576`, `2026-10`, `footprinting` or `Failed`.
7. **Print / PDF** prints the comparison (landscape), however many tests are in it:
   *Test details* (one row per test), then *All recorded values* if it's open, then the
   charts. The test slots aren't printed, since *Test details* lists every test.
   **⬇ CSV** saves every recorded value for the selected tests.

The page remembers the data and the selected tests on that computer, so next time it
opens ready to go. Click **Open data file…** again after adding tests to the workbook.
The grade and tests are also kept in the page address
(`…html#grade=634&tests=651,652,653`), so a bookmark reopens the same comparison.

## What it shows

| Workbook | Browser version |
|---|---|
| **234**: test # = *Set Number* | Same. Each test shows its lot and test date. |
| 234: Grade, Bake, LSO Number | *Test details*: one row per test with Grade, Lot, Bake, LSO Number, the three charted results and Comments. **All recorded values** shows every column of `Grade_234_TestData`, in a table per group (Test, Modified friction testing, Dummy commutator testing). |
| 234 charts: Ring Temp °C, Brush Life (Hrs/in), Coef. Of Friction | Same three charts, same number formats. Each bar is labelled with the set number and lot. |
| **634**: test # = *Lot Num.* | Same. Each test shows its set number and testing status. |
| 634: Set #, Bake, LSO | *Test details*: one row per test with Set #, Bake, LSO, Testing status, the three charted results and Comments. **All recorded values** shows every column of `Grade_634_TestData`, in a table per group (Test, Conditions, Results). |
| 634 charts: Average Brush Life (hrs/in), Coefficient of Friction, Contact Voltage Drop (Volts) | Same three charts, in the same order. |
| Five fixed test slots | Any number of tests. With more than eight, the charts use the full width and scroll sideways when there's no room (printing fits them to the page). |

With more than eight tests, each group in *All recorded values* is split into blocks of eight tests
("tests 9–16 of 28"), so every table fits the page width and doesn't split across printed pages.

Each test keeps its own colour in every chart (the first eight use the usual palette, later ones get evenly spread colours). Hover over a bar to see the test and value.
Values that are blank in the data (a failed or unfinished test) show as *n/a* instead of a
zero-height bar.

### Differences from the workbook

* **234 "Bake" row.** On `234Comparison` the row labelled *Bake* actually shows the
  **Lot** (it points at the *Lot* column of `234Control`), and the 234 charts are labelled
  by lot. The browser version shows both **Lot** and **Bake**, each from its own column.
* **234 LSO for Test 3.** `234Comparison!D6` points at `234Control!D10` (Test 4's row)
  instead of `D8`, so Test 3 shows Test 4's LSO number. The browser version uses each
  test's own value.
* **Blank cells show as blank.** `VLOOKUP` turns an empty cell into `0`, so the workbook
  shows an LSO number of `0` and charts a test with no results as a zero bar.
* **634 lookup range.** The `AllData1` name covers only `Grade_634_TestData!A1:U500`, so
  the 634 Grade lookup returns `#REF!`, and tests added below row 500 can't be found. The
  browser version reads every column and row.
* **Duplicate test numbers.** `VLOOKUP` only ever finds the first row with a test number.
  When a number appears more than once (234: `14083` five times, `26032` twice …; 634:
  `661`, `958`, `Trial`), the later runs are listed as `14083 (2)`, `14083 (3)` … so any
  of them can be compared, and a note says so.
* **Placeholder rows** in `Grade_234_TestData` (*Not Tested*, *Format Line*) aren't listed
  as tests.

## Developer notes

This repository is public, so `.gitignore` keeps workbooks and CSV exports out of it.
Don't commit real test data.

The data sheets have the *Grade* column filled down to row 1,048,576 (about 100 MB of XML
each once unpacked), so the page reads sheets as a stream and keeps only the rows that
hold test data. Loading the workbook takes about a second.

The end-to-end check runs the page in headless Chromium against a made-up workbook and
CSV:

```bash
python tests/make_sample.py /tmp/sample.xlsx /tmp/sample634.csv
```

```bash
node tests/check.cjs /tmp/sample.xlsx /tmp/sample634.csv
```

It needs Python with `openpyxl`, and Node with `playwright`.

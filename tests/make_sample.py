"""Write a small made-up workbook laid out like Dummy_Comm_Comparison_Spreadsheet.xlsx.

usage: python make_sample.py OUT.xlsx [OUT_634.csv]
The values are invented; they only exercise the page (layout, gaps, text, duplicates,
placeholder rows, a formula with no cached value, a filled-down Grade column).
The optional CSV is the 634 data sheet on its own, for the CSV-loading check.
"""
import csv
import datetime as dt
import sys

import openpyxl

H234 = ['Set Number', 'LSO No', 'Wear Face', 'Lot', 'Bake', 'Test Date', 'Test Machine', 'Speed (fpm)', 'Pressure',
        'C.V.D. (Start)', 'C.F. (Start)', 'Temp (Start)', 'C.V.D. (75amp/70deg)', 'C.F. (75amp/70deg)',
        'Temp (75amp/70deg)', 'C.V.D. (No Heat)', 'C.F. (No Heat)', 'Temp (No Heat)', 'C.F. (No Load)',
        'Temp (No Load)', 'Ambient Temp (°C)', 'Ambient RH (%)', 'Test Date', 'Test Machine', 'Speed (fpm)',
        'Pressure', 'Cur. Den. (APSI)', 'Ring Temp C', 'Brush Life (Hrs/in)', 'Coef. Of Friction',
        'Contact Drop (Volts)', 'Ambient Temp (°C)', 'Ambient RH (%)', 'Lab', 'SPC Data', 'Comments', 'Grade']

H634 = ['Lot Num.', 'Bake Num.', 'Set Num.', 'LSO Num.', 'Date', 'Machine', 'Sliding Speed (fpm)',
        'Spring Pressure (psi)', 'Current Density APSI', 'Slip Ring Temp. (°C)', 'Positive Brush Life (hrs/in)',
        'Negative Brush Life (hrs/in)', 'Average Brush Life (hrs/in)', 'Coefficient of Friction',
        'Contact Voltage Drop (Volts)', 'SPC Data', 'Lab', 'Parma Testing Status', 'Comments',
        'Relative Humidity (%)', 'Temperature (°C)', 'Grade']


def r234(sn, lot, bake, d1, d2, ring, life, cof, cvd, comment=None, lso=None):
    return [sn, lso, 'Center', lot, bake, d1, 'F', 8000, 8, 1.41, 0.148, 77, 1.95, 0.063, 72, 2.15, 0.067, 68,
            0.123, 56, 71, 40, d2, 'F', 8000, 8, 75, ring, life, cof, cvd, 70, 40, 'New', 'Y', comment, 234]


def r634(lot, bake, sn, lso, d, pos, neg, avg, cof, cvd, status='Complete', comment=None):
    return [lot, bake, sn, lso, d, 'B', 10000, 2.5, 55, 73, pos, neg, avg, cof, cvd, 'YES', 'NEW', status,
            comment, None, None, 634]


ROWS_234 = [
    r234(26001, 501, 7001, dt.datetime(2026, 1, 5), dt.datetime(2026, 1, 20), 73, 2481, 0.065, 2.01, lso=2026001),
    r234(26002, 502, 'L7002', dt.datetime(2026, 2, 5), dt.datetime(2026, 2, 20), 75, 12295, '=AVERAGE(0.07,0.08)', 1.91),
    r234(26003, 503, 7003, dt.datetime(2026, 3, 5), None, None, None, None, None, 'not run yet'),
    r234(26002, 502, 'L7002', dt.datetime(2026, 4, 5), dt.datetime(2026, 4, 20), 80, 4257, 0.103, 2.03, 'rerun'),
    ['Not Tested', None, 'Not Tested', 254, 'M8515', 'Not Tested'] + [None] * 30 + [234],
    ['Format Line'] + [None] * 35 + [234],
]

ROWS_634 = [
    r634(701, 4419, 15007, 2014582, dt.datetime(2015, 2, 3), 9333, 8796, 9064.5, 0.159, 4.11),
    r634(702, 4431, 15008, 2014606, dt.datetime(2015, 1, 26), 8936, 8485, 8710.5, 0.16, 4.04),
    r634('Trial', 'TG761', 17112, 2017250, dt.datetime(2018, 9, 25), 2907, 1783, 2211, 0.397, 2.4),
    r634('Trial', 'TG661', 17113, 2017251, dt.datetime(2018, 9, 14), 2442, 3083, 2723, 0.132, 3.16),
    r634(703, 4444, 15009, None, dt.datetime(2015, 1, 15), None, None, '', None, None, 'Failed', 'Discontinued after face-in'),
    r634('667-A2', 5004, 15030, 'M1160', dt.datetime(2016, 5, 1), 6512, 6154, 6333, 0.183, 3.98),
]


def main(out, csv_out=None):
    wb = openpyxl.Workbook()
    c234 = wb.active
    c234.title = '234Comparison'
    c234['A1'] = '234 Dummy Comm Testing'
    for col, v in enumerate(['Choose Test # From Table', 26001, 99999, 26002], 1):
        c234.cell(3, col, v)
    ctrl = wb.create_sheet('234Control')  # same headings as the data sheet: must not be mistaken for it
    for col, h in enumerate(H234, 9):
        ctrl.cell(2, col, h)
        ctrl.cell(3, col, 0)
    ws = wb.create_sheet('Grade_234_TestData')
    ws['F1'], ws['W1'] = 'Modified Friction Testing', 'Dummy Commutator Testing'
    ws.append(H234)
    for r in ROWS_234:
        ws.append(r)
    for r in range(ws.max_row + 1, ws.max_row + 300):  # Grade filled down, as in the real sheet
        ws.cell(r, 37, 234)

    c634 = wb.create_sheet('634Comparison')
    for col, v in enumerate(['Choose Test # From Table', 702, 'Trial'], 1):
        c634.cell(3, col, v)
    ws = wb.create_sheet('Grade_634_TestData')
    ws.append(H634)
    for r in ROWS_634:
        ws.append(r)
    for r in range(ws.max_row + 1, ws.max_row + 300):
        ws.cell(r, 22, 634)
    wb.save(out)

    if csv_out:
        with open(csv_out, 'w', newline='', encoding='utf-8') as f:
            w = csv.writer(f)
            w.writerow(H634)
            extra = r634(704, 4500, 15040, 2015000, '2016-07-01', 7000, 7200, 7100, 0.15, 4.0)
            for r in ROWS_634 + [extra]:
                w.writerow(['' if v is None else v.strftime('%Y-%m-%d') if isinstance(v, dt.datetime) else v for v in r])


if __name__ == '__main__':
    main(*sys.argv[1:3])

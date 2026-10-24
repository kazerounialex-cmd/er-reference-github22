from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import Table, TableStyle, Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors

target=Path(__file__).resolve().parents[1]/'dist/blood-collection-blank.pdf'
c=canvas.Canvas(str(target),pagesize=letter)
c.setTitle('Blood Collection Log - Blank Cage Sheet')
c.setAuthor('ER Reference')
c.setStrokeColor(colors.black)
c.setFont('Helvetica-Bold',20);c.drawString(36,752,'BLOOD COLLECTION LOG')
c.setFont('Helvetica',9);c.drawString(36,736,'Cage-side record - record blood removed, including discarded blood')
for y,left,right in [(711,'Patient:','Record / cage:'),(691,'Species:','Weight:                                      kg'),(671,'Sheet start:','Clinician:')]:
    c.setFont('Helvetica-Bold',9);c.drawString(36,y,left);c.drawString(310,y,right)
    c.setLineWidth(.5);c.line(36+len(left)*4.9,y-3,290,y-3);c.line(310+len(right.split(':')[0])*4.8+9,y-3,576,y-3)
labels=['ESTIMATED BLOOD VOLUME','WORKBOOK 24-HOUR GUIDE','WORKBOOK 14-DAY GUIDE']
for i,label in enumerate(labels):
    x=36+i*183
    c.setLineWidth(1);c.rect(x,598,174,55)
    c.setFont('Helvetica-Bold',8);c.drawString(x+8,636,label)
    c.setFont('Helvetica-Bold',17);c.drawString(x+8,612,'________ mL')
c.setFont('Helvetica',8);c.drawString(36,583,'Method / assumptions: __________________________________________________________________________')
c.drawString(36,572,'Workbook planning estimates are not universal patient-specific limits; follow the clinician-approved plan.')
c.setLineWidth(1);c.rect(36,531,540,29)
c.setFont('Helvetica-Bold',9);c.drawString(44,542,'Clinician-approved plan: ______ mL / 24 hr     ______ mL / 14 days     Initials: ______')
c.setFont('Helvetica',9);c.drawString(36,517,'Prior removal carried forward: last 24 hr ______ mL       last 14 days ______ mL')
style=ParagraphStyle('header',fontName='Helvetica-Bold',fontSize=8,leading=10)
headers=['Date','Time','Blood removed<br/>(mL)*','Sheet running<br/>total (mL)','Draw site','Test / reason','Initials']
data=[[Paragraph(t,style) for t in headers]]+[['']*7 for _ in range(16)]
t=Table(data,colWidths=[48,42,72,78,66,192,42],rowHeights=[30]+[21]*16)
t.setStyle(TableStyle([('GRID',(0,0),(-1,-1),.6,colors.black),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),4)]))
w,h=t.wrap(540,500);assert w==540 and h==366
t.drawOn(c,36,500-h)
c.setFont('Helvetica-Bold',9);c.drawString(36,118,'Sheet total: ______ mL    Rolling 24-hour total: ______ mL    Rolling 14-day total: ______ mL')
c.setFont('Helvetica',9);c.drawString(36,97,'Notes / changes: ______________________________________________________________________________')
c.setFont('Helvetica',8);c.drawString(36,78,'*Include discarded blood; do not count saline flush as blood. Rolling totals include prior draws and other sheets.')
c.drawString(36,66,'Both time windows apply. A new sheet does not reset the allowance. This is a manual log; totals are not automatic.')
c.setFont('Helvetica',7.5);c.drawString(36,49,'Source method: Fluids Calculator workbook, Fluids!L44:U54. Individualize the plan for the patient.')
c.showPage();c.save()
print(target)

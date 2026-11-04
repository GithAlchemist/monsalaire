/**
 * "Share as PDF": a picture of the payslip on an A4 page, with a clickable link that reopens exactly this simulation
 * (the figures live in the address). The two libraries are loaded only when someone asks for a PDF.
 */
export async function payslipPdf(opts: { url: string; fileName: string; linkText: string; title: string; lang: 'fr' | 'en' }): Promise<'shared' | 'saved'> {
  const sheet = document.querySelector<HTMLElement>('.sheet');
  if (!sheet) throw new Error('payslip not found');
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas-pro')]);

  document.documentElement.classList.add('pdf-capture');
  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(sheet, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
  } finally {
    document.documentElement.classList.remove('pdf-capture');
  }

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  pdf.setProperties({ title: opts.title, creator: 'monsalaire.aconta.io' });
  const pageW = 210;
  const margin = 12;
  const w = pageW - margin * 2;
  const h = Math.min((canvas.height * w) / canvas.width, 297 - margin * 2 - 16);
  const imgW = (canvas.width * h) / canvas.height;
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', (pageW - imgW) / 2, margin, imgW, h);

  // The way back: one click reopens the simulation with the same figures.
  const y = margin + h + 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(7, 63, 42);
  pdf.textWithLink(opts.linkText, margin, y, { url: opts.url });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(110, 110, 110);
  pdf.textWithLink(opts.url.length > 120 ? `${opts.url.slice(0, 117)}...` : opts.url, margin, y + 4.5, { url: opts.url });

  const blob = pdf.output('blob');
  const file = new File([blob], opts.fileName, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] }) && window.matchMedia('(pointer: coarse)').matches) {
    await nav.share({ files: [file], title: opts.title });
    return 'shared';
  }
  pdf.save(opts.fileName);
  return 'saved';
}

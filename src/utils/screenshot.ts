import html2canvas from 'html2canvas';

export async function captureScreenshot(elementId: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;

  const canvas = await html2canvas(element, {
    backgroundColor: '#0b0e11',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const link = document.createElement('a');
  link.download = `trade-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function captureAsImage(elementId: string): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) return '';

  const canvas = await html2canvas(element, {
    backgroundColor: '#0b0e11',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  return canvas.toDataURL('image/png');
}

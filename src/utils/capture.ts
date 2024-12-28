import {
  Notice, requestUrl, type App, type TFile,
} from 'obsidian';
import saveAs from 'file-saver';
import JsPdf from 'jspdf';
import domtoimage from '../dom-to-image-more';
import L from '../L';
import makeHTML from './makeHTML';
import { fileToBase64, delay, getMime } from '.';
import { splitMarkdown } from './splitMarkdown';
import JSZip from 'jszip';

async function getBlob(el: HTMLElement, highResolution: boolean, type: string): Promise<Blob> {
  return domtoimage.toBlob(el, {
    width: el.clientWidth,
    height: el.clientHeight,
    quality: 0.85,
    scale: highResolution ? 2 : 1,
    requestUrl,
    type,
  }) as Promise<Blob>;
}

async function makePdf(blob: Blob, el: HTMLElement) {
  const dataUrl = await fileToBase64(blob);
  const pdf = new JsPdf({
    unit: 'in',
    format: [el.clientWidth / 96, el.clientHeight / 96],
    orientation: el.clientWidth > el.clientHeight ? 'l' : 'p',
    compress: true,
  });
  pdf.addImage(
    dataUrl,
    'JPEG',
    0,
    0,
    el.clientWidth / 96,
    el.clientHeight / 96,
  );
  return pdf;
}

export async function save(
  app: App,
  file: TFile,
  title: string,
  highResolution: boolean,
  format: FileFormat,
  isMobile: boolean,
) {
  const markdown = await app.vault.cachedRead(file);
  const sections = splitMarkdown(markdown, 2000); // Adjust the maxLength as needed
  const zip = new JSZip();

  for (const [index, section] of sections.entries()) {
    const el = document.createElement('div');
    el.innerHTML = section;
    const blob: Blob = await getBlob(el, highResolution, getMime(format));
    const filename = `${title.replaceAll(/\s+/g, '_')}_part${index + 1}.${format.replace(/\d$/, '')}`;
    
    // Add the blob to the zip
    zip.file(filename, blob);
  }

  // Generate the zip file and trigger download
  zip.generateAsync({ type: 'blob' }).then((content) => {
    const zipFilename = `${title.replaceAll(/\s+/g, '_')}.zip`;
    saveAs(content, zipFilename);
  });
}

export async function copy(
  el: HTMLElement,
  higtResolution: boolean,
  format: FileFormat,
) {
  if (format === 'pdf') {
    new Notice(L.copyNotAllowed());
    return;
  }

  const blob = await getBlob(
    el,
    higtResolution,
    getMime(format),
  );
  const data: ClipboardItem[] = [];
  data.push(
    new ClipboardItem({
      [blob.type]: blob,
    }),
  );
  await navigator.clipboard.write(data);
  new Notice(L.copiedSuccess());
}

export async function saveMultipleFiles(
  files: TFile[],
  settings: ISettings,
  onProgress: (finished: number) => void,
  app: App,
  folderName: string,
  containner: HTMLDivElement,
) {
  const { format, '2x': higtResolution } = settings;
  let finished = 0;
  if (format === 'pdf') {
    let pdf: JsPdf | undefined;
    for (const file of files) {
      const el = await makeHTML(file, settings, app, containner);
      await delay(20);
      const width = el.clientWidth;
      const height = el.clientHeight;
      const blob = await getBlob(
        el as HTMLElement,
        higtResolution,
        'image/jpeg',
      );
      const dataUrl = await fileToBase64(blob);
      if (pdf) {
        pdf.addPage([width / 96, height / 96], width > height ? 'l' : 'p');
      } else {
        pdf = new JsPdf({
          unit: 'in',
          format: [width / 96, height / 96],
          orientation: width > height ? 'l' : 'p',
          compress: true,
        });
      }

      pdf.addImage(dataUrl, 'JPEG', 0, 0, width / 96, height / 96);
      finished++;
      onProgress(finished);
    }

    if (!pdf) {
      return;
    }

    const fileName = `${folderName.replaceAll(/\s+/g, '_')}.pdf`;
    // @ts-ignore
    if (app.isMobile) {
      const filePath = await app.fileManager.getAvailablePathForAttachment(
        fileName,
      );
      await app.vault.createBinary(filePath, pdf.output('arraybuffer'));
    } else {
      pdf?.save(fileName);
    }
  } else {
    for (const file of files) {
      const el = await makeHTML(file, settings, app, containner);
      await save(
        app,
        file,
        file.basename,
        higtResolution,
        format,
        true,
      );
      finished++;
      onProgress(finished);
    }
  }
}

export async function getRemoteImageUrl(url?: string) {
  if (!url || !url.startsWith('http')) {
    return url;
  }
  try {
    const response = await requestUrl({
      url,
      method: 'GET',
    });
    const blob = new Blob([response.arrayBuffer], { type: response.headers['content-type'] || 'application/octet-stream' });
    const res = URL.createObjectURL(blob);
    return res;
  } catch (error) {
    console.error('Failed to load image:', error);
    return url;
  }
}

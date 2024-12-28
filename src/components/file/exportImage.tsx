import { splitMarkdown } from 'src/utils/splitMarkdown';
import domtoimage from 'dom-to-image-more';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default async function (
  app: App,
  settings: ISettings,
  markdown: string,
  file: TFile,
) {
  const maxLinesPerImage = 20; // Adjust based on desired image height
  const chunks = splitMarkdown(markdown, maxLinesPerImage);
  
  const zip = new JSZip();
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const el = document.createElement('div');
    
    // Render Markdown chunk
    await MarkdownRenderer.render(
      app,
      chunk,
      el.createDiv(),
      file.path,
      app.workspace.getActiveViewOfType(MarkdownView) || new MarkdownRenderChild(el),
    );

    // Convert rendered element to image
    try {
      const dataUrl = await domtoimage.toPng(el);
      zip.file(`page-${i + 1}.png`, dataUrl.split(',')[1], { base64: true });
    } catch (error) {
      console.error(`Error exporting page ${i + 1}:`, error);
    }
  }

  // Save all images as a zip file
  zip.generateAsync({ type: 'blob' }).then((content) => {
    saveAs(content, `${file.basename}-screenshots.zip`);
  });
}

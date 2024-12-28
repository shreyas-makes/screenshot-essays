export function splitMarkdown(content: string, maxLines: number): string[] {
    const lines = content.split('\n');
    const chunks: string[] = [];
    let currentChunk: string[] = [];
  
    lines.forEach((line) => {
      if (currentChunk.length + 1 > maxLines) {
        chunks.push(currentChunk.join('\n'));
        currentChunk = [];
      }
      currentChunk.push(line);
    });
  
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n'));
    }
  
    return chunks;
  }
  
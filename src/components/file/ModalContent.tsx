import React, { useState } from 'react';
import { splitMarkdown } from '../../utils/splitMarkdown';

const ModalContent: FC<{ markdown: string; settings: ISettings }> = ({ markdown, settings }) => {
  const [chunks] = useState(() => splitMarkdown(markdown, settings.maxLines || 20));

  return (
    <div>
      {chunks.map((chunk, index) => (
        <div key={index} className="preview-container">
          <h4>Page {index + 1}</h4>
          <div className="markdown-preview">
            <MarkdownRenderer markdown={chunk} />
          </div>
        </div>
      ))}
      <button onClick={() => handleExport(chunks)}>Export All</button>
    </div>
  );
};

async function handleExport(chunks: string[]) {
  // Call updated export logic here
}

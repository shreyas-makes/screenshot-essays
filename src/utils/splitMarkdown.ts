export function splitMarkdown(markdown: string, maxLength: number): string[] {
    const sections: string[] = [];
    let currentSection = '';

    const lines = markdown.split('\n');
    for (const line of lines) {
        if ((currentSection + line).length > maxLength) {
            sections.push(currentSection);
            currentSection = line; // Start a new section
        } else {
            currentSection += line + '\n';
        }
    }
    if (currentSection) {
        sections.push(currentSection); // Push the last section
    }

    return sections;
} 
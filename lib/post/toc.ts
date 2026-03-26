interface Heading {
  level: number;
  text: string;
  id: string;
}

export function extractHeadings(markdown: string) {
  const regex = /^(#{1,3})\s+(.*)/gm;

  const headings: Heading[] = [];
  let match;

  while ((match = regex.exec(markdown))) {
    headings.push({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/\s+/g, '-'),
    });
  }

  return headings;
}

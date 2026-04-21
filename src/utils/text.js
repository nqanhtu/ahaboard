// Extract plain text from rich editor JSON for card preview
export const getPreviewText = (desc) => {
  if (!desc) return null;
  try {
    const data = JSON.parse(desc);
    // Tiptap JSON format (doc > content > paragraph/heading nodes)
    if (data.type === 'doc' && data.content) {
      const extractText = (nodes) => {
        if (!nodes) return '';
        return nodes.map(node => {
          if (node.text) return node.text;
          if (node.content) return extractText(node.content);
          return '';
        }).join(' ');
      };
      return extractText(data.content).trim();
    }
    // Editor.js format (blocks array) — backward compatibility
    if (data.blocks) {
      return data.blocks.map(b => b.data?.text || '').join(' ').replace(/<[^>]*>?/gm, '');
    }
    return desc;
  } catch(e) {
    return desc;
  }
}

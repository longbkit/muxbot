export function prependAttachmentMentions(text: string, attachmentPaths: string[]) {
  const normalizedText = text.trim();
  if (attachmentPaths.length === 0) {
    return normalizedText;
  }

  if (normalizedText.startsWith("/") || normalizedText.startsWith("!")) {
    return normalizedText;
  }

  const audioExts = new Set([".ogg", ".oga", ".mp3", ".wav", ".m4a", ".webm"]);
  const mentions = attachmentPaths
    .map((value) => {
      const ext = value.slice(value.lastIndexOf(".")).toLowerCase();
      return audioExts.has(ext) ? `(voice message: ${value})` : `@${value}`;
    })
    .join(" ");
  return normalizedText ? `${mentions} ${normalizedText}` : mentions;
}

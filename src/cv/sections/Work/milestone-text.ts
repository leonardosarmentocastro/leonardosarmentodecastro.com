export const splitMilestoneText = (
  text: string,
): { emoji: string; body: string } => {
  const match = text.match(/^(\p{Extended_Pictographic}+)\s*(.*)$/u);
  if (!match) return { emoji: "", body: text };
  return { emoji: match[1], body: match[2] };
};

export function get_caret_position(e: MouseEvent) {
  let node: Node | null = null;
  let offset: number | null = null;
  // @ts-ignore
  if (document.caretPositionFromPoint) {
    // @ts-ignore
    const result = document.caretPositionFromPoint(e.clientX, e.clientY);
    if (result) {
      node = result.offsetNode;
      offset = result.offset;
    }
  }
  // @ts-ignore
  const result = document.caretRangeFromPoint(e.pageX, e.pageY);
  if (result) {
    node = result.startContainer;
    offset = result.startOffset;
  }
  return { node, offset };
}

export function get_caret_position_for_text(e: MouseEvent) {
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

export function find_ancestor_below(
  el: Element | null,
  earlier_ancestor: Element
) {
  let current: Element | null = el;
  while (current && current !== earlier_ancestor) {
    if (current.parentElement === earlier_ancestor) return current;
    current = current.parentElement;
  }
  return null;
}
export function find_index_of_parent(el: Element, parent: Element) {
  return Array.prototype.indexOf.call(parent.children, el);
}

export function clear_dom_selection() {
  document.getSelection()?.removeAllRanges();
}

// export function get_caret_position_for_block(e: MouseEvent) {
//   const target = e.target;
//   if (!(target instanceof HTMLElement)) return null;
//   const el = target.closest(":scope > *");
//   Array.prototype.indexOf()
// }

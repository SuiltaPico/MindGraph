import { Area } from "../Area";

export type MixEditorMouseEvent = MouseEvent & {
  mix_selection_changed?: boolean;
};

export function find_index_in_parent_area(area: Area, parent: Area) {
  const length = parent.children_count();
  for (let i = 0; i < length; i++) {
    const child = parent.get_child(i);
    if (child === area) return i;
  }
  return -1;
}

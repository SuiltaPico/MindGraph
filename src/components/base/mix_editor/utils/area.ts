import { Area } from "../Area";
import { MaybeArea } from "../MixEditor";

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

export function for_each_area_children(
  area: Area,
  callback: (area: MaybeArea) => false | void
) {
  const length = area.children_count();
  for (let i = 0; i < length; i++) {
    const child = area.get_child(i);
    const result = callback(child);
    if (result === false) return;
  }
}

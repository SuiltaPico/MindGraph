import { createSignal } from "@/common/signal";
import { MixEditor } from "./MixEditor";

export type CaretRendererType = (props: { editor: MixEditor<any, any> }) => any;

export type CollapsedSelected = {
  type: "collapsed";
  start_path: number[];
};

export type ExtendedSelected = {
  type: "extended";
  start_path: number[];
  end_path: number[];
};

export type Selected = CollapsedSelected | ExtendedSelected;

/** 选区。 */
export class Selection {
  selected = createSignal<Selected | undefined>(undefined);
  caret_height = createSignal<number>(16);

  collapsed_select(path: number[]) {
    this.selected.set({
      type: "collapsed",
      start_path: path,
    });
  }

  extended_select(start_path: number[], end_path: number[]) {
    this.selected.set({
      type: "extended",
      start_path,
      end_path,
    });
  }
  clear() {
    this.selected.set(undefined);
  }
  get() {
    return this.selected.get();
  }

  move_left() {
    const selected = this.selected.get();
    if (!selected) return;

    const start_path = selected.start_path;
    const last_index = start_path[start_path.length - 1];

    /** 需要移动到左邻近块的最后一个索引。 */
    if (last_index === 0) {
    } else {
      start_path[start_path.length - 1]--;
      this.collapsed_select(start_path);
    }
  }

  move_right() {
    const selected = this.selected.get();
    if (!selected) return;

    const start_path = selected.start_path;
    const last_index = start_path[start_path.length - 1];

    /** 需要移动到左邻近块的最后一个索引。 */
    if (
      last_index ===
      this.editor.get_area_of_path(start_path.slice(0, -1))?.children_count()
    ) {
    } else {
      start_path[start_path.length - 1]++;
      this.collapsed_select(start_path);
    }
  }

  constructor(public editor: MixEditor<any, any>) {}
}

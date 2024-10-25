import { createSignal } from "@/common/signal";
import { MixEditor } from "./MixEditor";

export type CaretRendererType = (props: { editor: MixEditor<any, any> }) => any;

export type CollapsedSelected = {
  type: "collapsed";
  start_path: number[];
}

export type ExtendedSelected = {
  type: "extended";
  start_path: number[];
  end_path: number[];
}

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
}

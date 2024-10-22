import { createSignal } from "@/common/signal";

/** 选区。 */
export class Selection {
  start_path = createSignal<number[]>([]);
  end_path = createSignal<number[]>([]);

  set_start_path(path: number[]) {
    this.start_path.set(path);
  }

  set_end_path(path: number[]) {
    this.end_path.set(path);
  }
}

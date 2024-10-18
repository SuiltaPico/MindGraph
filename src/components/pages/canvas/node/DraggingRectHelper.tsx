import { Component, createEffect, For, on } from "solid-js";
import { NodeCanvas } from "./NodeCanvas";
import { createSignal, WrappedSignal } from "@/common/signal";
import {
  calc_dragging_rects,
  DraggingRect,
  DraggingRectElement,
} from "../utils/dragging_rect";
import { Canvas } from "../Canvas";

export class DraggingRectHelper {
  dragging_rects = createSignal<DraggingRect[]>([]);

  init(field: HTMLElement) {
    createEffect(
      on(this.canvas.dragging_node_data.get, (dragging_node_data) => {
        if (dragging_node_data?.type === "dragging") {
          this.dragging_rects.set(
            calc_dragging_rects(
              this.canvas,
              field,
              this.node_canvas.root_rc,
              this.node_canvas.offset_x,
              this.node_canvas.offset_y
            )
          );
        }
      })
    );
  }

  constructor(public canvas: Canvas, public node_canvas: NodeCanvas) {}
}

/** 拖拽矩形层。 */
export const DraggingRectLayer: Component<{
  dragging_rects: WrappedSignal<DraggingRect[]>;
}> = (props) => {
  return (
    <For each={props.dragging_rects.get()}>
      {(rect) => {
        const result = (
          <div
            class="__rect"
            style={{
              left: `${rect.x}px`,
              top: `${rect.y}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          ></div>
        ) as DraggingRectElement;
        result._rect = rect;
        return result;
      }}
    </For>
  );
};

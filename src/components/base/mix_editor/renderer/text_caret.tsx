import { createSignal } from "@/common/signal";
import { Component } from "solid-js";

export class TextCaret {
  show = createSignal<boolean>(false);
  constructor() {}
}

export const TextCaretRenderer: Component<{ state: TextCaret }> = (props) => {
  const show = props.state.show;
  return show.get() && <div class="__text_caret"></div>;
};

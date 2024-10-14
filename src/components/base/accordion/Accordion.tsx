import { createSignal } from "@/common/signal";
import { Component, Show, splitProps } from "solid-js";
import { JSX } from "solid-js";
import { Icon } from "../icon/Icon";
import { mdiChevronDown } from "@mdi/js";
import "./Accordion.css";
import clsx from "clsx";
import { Row } from "../block/Flex";

export class Accordion {
  title = createSignal<JSX.Element>("");
  content = createSignal<JSX.Element>("");
  is_open = createSignal(false);

  open() {
    this.is_open.set(true);
  }
  close() {
    this.is_open.set(false);
  }
}

export const AccordionRenderer: Component<
  {
    state: Accordion;
    _title: JSX.Element;
    _content: JSX.Element;
  } & JSX.HTMLAttributes<HTMLDivElement>
> = (props) => {
  const { state, _title, _content } = props;
  state.title.set(_title);
  state.content.set(_content);

  const [_, pure] = splitProps(props, ["class", "children"]);

  return (
    <div
      class={clsx(props.class, props.classList, "_m_accordion", {
        __open__: state.is_open.get(),
      })}
      {...(pure as any)}
    >
      <Row
        class="__title"
        onClick={() => state.is_open.set(!state.is_open.get())}
      >
        <div class="__text">{state.title.get()}</div>
        <Icon class="__icon" path={mdiChevronDown}></Icon>
      </Row>
      <Show when={state.is_open.get()}>
        <div class="__content">{state.content.get()}</div>
      </Show>
    </div>
  );
};

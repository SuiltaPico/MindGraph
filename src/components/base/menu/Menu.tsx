import { Component, Show } from "solid-js";
import "./Menu.scss";

import { createSignal } from "@/common/signal";

export interface MenuItem {
  name: string;
  onclick?: () => void;
  children?: MenuItem[];
}

export class MenuContext {
  showing = createSignal(false);
  list = createSignal<MenuItem[]>([]);
}

export const MenuRenderer: Component<{
  context: MenuContext;
}> = (props) => {
  const context = props.context;
  return (
    <Show when={context.showing.get()}>
      <div class="_m_menu_container">
        <MenuListRenderer list={context.list.get()} />
      </div>
    </Show>
  );
};

export const MenuListRenderer: Component<{
  list: MenuItem[];
}> = (props) => {
  return (
    <div class="__menu_list">
      {props.list.map((item) => (
        <MenuItemRenderer item={item} />
      ))}
    </div>
  );
};

export const MenuItemRenderer: Component<{
  item: MenuItem;
}> = (props) => {
  return (
    <div class="__menu_item" onclick={props.item.onclick}>
      <div class="__name">{props.item.name}</div>
      {props.item.children && <MenuListRenderer list={props.item.children} />}
    </div>
  );
};

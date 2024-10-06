import { Component } from "solid-js";
import { Icon } from "./Icon";
import * as mdiIcons from "@mdi/js";
import "./List.scss";

export interface ListItem {
  text: string;
  icon?: string;
  functions?: (() => void) | Array<() => void>;
}

export interface ListProps {
  items: ListItem[];
}

export const ListRenderer: Component<ListProps> = (props) => {
  const handleItemClick = (functions?: (() => void) | Array<() => void>) => {
    if (functions) {
      if (Array.isArray(functions)) {
        functions.forEach((func) => func());
      } else {
        functions();
      }
    }
  };
  return (
    <div class="_list">
      {props.items.map((item) => (
        <div
          class="__list_item"
          onClick={() => handleItemClick(item.functions)}
          tabindex="0"
        >
          {item.icon && (
            <Icon class="__list_icon" path={mdiIcons[item.icon]}></Icon>
          )}
          <div class="__list_text">{item.text}</div>
        </div>
      ))}
    </div>
  );
};

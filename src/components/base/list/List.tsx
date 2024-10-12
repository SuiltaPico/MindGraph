import { Component } from "solid-js";
import { Icon } from "@/components/base/icon/Icon";
import * as mdiIcons from "@mdi/js";
import "./List.scss";
import { Block } from "@/components/base/block/Block";

export interface ListItem {
  text: string;
  description?: string;
  icon?: keyof typeof mdiIcons;
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
          <div class="__list_left">
            {item.icon && (
              <>
                <Icon class="__list_icon" path={mdiIcons[item.icon]} />
                <Block size={10} />
              </>
            )}
            <div class="__list_text">{item.text}</div>
          </div>
          <div class="__list_right">
            {item.description && (
              <>
                <Block size={10} />
                <div class="__list_description">{item.description}</div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

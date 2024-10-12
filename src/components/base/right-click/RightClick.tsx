import { ListRenderer, ListItem } from "@/components/base/list/List";
import { Divider } from "@/components/base/divider/Divider";
import { createSignal, onMount, onCleanup, Component } from "solid-js";
import "./RightClick.scss";

export const RightClickRenderer = () => {
  const menu_items1: ListItem[] = [
    {
      text: "复制",
      functions: () => {
        alert("还没做");
      },
    },
    {
      text: "粘贴",
      functions: () => {
        alert("还没做");
      },
    },
  ];
  const menu_items2: ListItem[] = [
    {
      text: "折叠此节点",
      functions: () => {
        alert("还没做");
      },
    },
    {
      text: "展开此节点",
      functions: () => {
        alert("还没做");
      },
    },
    {
      text: "以当前节点为根节点",
      functions: () => {
        alert("还没做");
      },
    },
    {
      text: "插入分支",
      functions: () => {
        alert("还没做");
      },
    },
  ];

  return (
    <div class="__right_click_container">
      <ListRenderer items={menu_items1} />
      <Divider />
      <ListRenderer items={menu_items2} />
    </div>
  );
};

export const RightClick: Component = () => {
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = createSignal(false);

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  };

  const handleClick = () => {
    setIsOpen(false);
  };

  onMount(() => {
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClick);

    onCleanup(() => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClick);
    });
  });

  return (
    <>
      {isOpen() && (
        <div
          class="_right_click"
          style={{
            left: `${position().x}px`,
            top: `${position().y}px`,
          }}
        >
          <RightClickRenderer />
        </div>
      )}
    </>
  );
};

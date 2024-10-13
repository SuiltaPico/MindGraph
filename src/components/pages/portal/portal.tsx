import "./portal.scss";
import { ListRenderer, ListItem } from "@/components/base/list/List";
import { useContext, Component, createSignal, JSXElement } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { DisplayRenderer } from "./DisplayRenderer";
import { app_context } from "src/AppContext.tsx";
import { CanvasRenderer } from "../canvas/CanvasRenderer";

export const PortalRenderer = () => {
  const navigate = useNavigate();
  const [toDisplay, setToDisplay] = createSignal<string | JSXElement>("empty");
  const ac = useContext(app_context)!;

  const goToCanvas = () => {
    navigate("/canvas");
  };

  const showCanvas = () => {
    return;
  };

  const function_item: ListItem[] = [
    {
      text: "回到工作",
      icon: "mdiBackburger",
      functions: goToCanvas,
      description: "这是一个有关于列表的测试啊！",
    },
    {
      text: "新建文件",
      icon: "mdiFolderEditOutline",
      functions: [
        async () => {
          await ac.mg_new();
          showCanvas();
        },
        goToCanvas,
      ],
    },
    {
      text: "打开文件",
      icon: "mdiFolderArrowLeftOutline",
      functions: async () => {
        await ac.open_mg();
        showCanvas();
      },
    },
  ];
  const setting_item: ListItem[] = [
    {
      text: "设置",
      icon: "mdiCog",
      functions: () => {
        alert("还没做");
      },
    },
  ];

  return (
    <div class="_portal_container">
      <div class="__portal_left">
        <div class="__portal_title">MindGraph</div>
        <div class="__portal_function_container">
          <div class="__portal_function_zone">
            <ListRenderer items={function_item} />
            <ListRenderer items={setting_item} />
          </div>
        </div>
      </div>
      <div class="__portal_right">
        <div class="__portal_displayzone">
          <DisplayRenderer display={toDisplay()} />
        </div>
      </div>
    </div>
  );
};

export const Portal: Component = () => {
  return (
    <div class="_portal">
      <PortalRenderer />
    </div>
  );
};

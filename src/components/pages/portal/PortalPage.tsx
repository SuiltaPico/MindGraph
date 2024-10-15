import { Row } from "@/components/base/block/Flex";
import { ListItem, ListRenderer } from "@/components/base/list/List";
import { useNavigate } from "@solidjs/router";
import { Component, JSXElement, useContext } from "solid-js";
import { app_context } from "src/AppContext.tsx";
import { DisplayRenderer } from "./DisplayRenderer";
import "./PortalPage.css";
import { createSignal } from "@/common/signal";

export const PortalRenderer = () => {
  const navigate = useNavigate();
  const toDisplay = createSignal<string | JSXElement>("empty");
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
    <Row class="_portal_container">
      <div class="__left">
        <div class="__title">MindGraph</div>
        <div class="__function_container">
          <div class="__zone">
            <ListRenderer items={function_item} />
            <ListRenderer items={setting_item} />
          </div>
        </div>
      </div>
      <div class="__right">
        <div class="__displayzone">
          <DisplayRenderer display={toDisplay.get()} />
        </div>
      </div>
    </Row>
  );
};

export const PortalPage: Component = () => {
  return (
    <div class="page_portal">
      <PortalRenderer />
    </div>
  );
};

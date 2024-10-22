import { Component } from "solid-js";
import { Block, Inline, MixEditor } from "./MixEditor";

export type Plugin = {
  block_renderer?: Record<
    any,
    Component<{ editor: MixEditor<any, any>; block: Block<any, any> }>
  >;
  inline_renderer?: Record<
    any,
    Component<{ editor: MixEditor<any, any>; inline: Inline<any, any> }>
  >;
};

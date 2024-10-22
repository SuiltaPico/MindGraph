import { render } from "solid-js/web";
import { Plugin } from "./plugin";
import { Paragraph, ParagraphBlock } from "./plugins/paragraph";
import { Selection } from "./selection";
import { Component } from "solid-js";
import { Text } from "./plugins/text";
import { createSignal } from "@/common/signal";

export type Block<TName extends string, TData> = {
  type: TName;
  data: TData;
};

export type Inline<TName extends string, TData> = {
  type: TName;
  data: TData;
};

export type Config = {
  plugins: Plugin[];
};

/** 富文本混合编辑器。 */
export class MixEditor<
  TBlock extends Block<any, any>,
  TInline extends Inline<any, any>
> {
  selection = new Selection();
  data = createSignal<TBlock[]>([]);

  block_renderer: Exclude<Plugin["block_renderer"], undefined> = {} as any;
  inline_renderer: Exclude<Plugin["inline_renderer"], undefined> = {} as any;

  get_block_renderer(type: TBlock["type"]) {
    return this.block_renderer[type];
  }

  get_inline_renderer(type: TInline["type"]) {
    return this.inline_renderer[type];
  }

  constructor(config: Config) {
    config.plugins.forEach((plugin) => {
      if (plugin.block_renderer) {
        for (const [key, value] of Object.entries(plugin.block_renderer)) {
          this.block_renderer[key as TBlock["type"]] = value as any;
        }
      }
      if (plugin.inline_renderer) {
        for (const [key, value] of Object.entries(plugin.inline_renderer)) {
          this.inline_renderer[key as TInline["type"]] = value as any;
        }
      }
    });
  }
}

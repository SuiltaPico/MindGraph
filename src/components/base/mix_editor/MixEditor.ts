import { Position } from "@/common/math";
import { createSignal } from "@/common/signal";
import { Plugin } from "./plugin";
import { Selection } from "./selection";
import { MaybePromise } from "@/common/async";
import { BlockSavedData, InlineSavedData, LoaderMap, SavedData } from "./save";
import { RendererMap } from "./renderer";
import {
  UnknownBlockRenderer,
  UnknownInlineRenderer,
} from "./renderer/MixEditorRenderer";

export type BaseArea = {
  save: () => MaybePromise<any>;
  get_child(index: number): MaybeArea;
  get_child_position(index: number): Position | void;
};
/** 块区域。 */
export type Block<TName extends string = string, TData = any> = BaseArea & {
  save: () => MaybePromise<BlockSavedData>;
  type: TName;
  data: TData;
};

/** 行内区域。 */
export type Inline<TName extends string = string, TData = any> = BaseArea & {
  save: () => MaybePromise<InlineSavedData>;
  type: TName;
  data: TData;
};

export type Area = Block<any, any> | Inline<any, any>;
export const NotArea = "not_area" as const;
export type MaybeArea = Area | typeof NotArea;

export type Config = {
  plugins: Plugin[];
};

/** 富文本混合编辑器。 */
export class MixEditor<
  TBlock extends Block<any, any> = Block<any, any>,
  TInline extends Inline<any, any> = Inline<any, any>
> {
  selection = new Selection();
  data = createSignal<TBlock[]>([]);

  loader: LoaderMap = {} as any;
  renderer: RendererMap = {} as any;

  get_block_renderer(type: TBlock["type"]) {
    return this.renderer.block?.get(type) ?? UnknownBlockRenderer;
  }

  get_inline_renderer(type: TInline["type"]) {
    return this.renderer.inline?.get(type) ?? UnknownInlineRenderer;
  }

  save() {
    return this.data.get();
  }

  constructor(config: Config) {
    config.plugins.forEach((plugin) => {
      const renderer = plugin.renderer;
      const loader = plugin.loader;

      if (renderer) {
        if (renderer.block) {
          for (const [key, value] of Object.entries(renderer.block)) {
            this.renderer.block[key as TBlock["type"]] = value as any;
          }
        }
        if (renderer.inline) {
          for (const [key, value] of Object.entries(renderer.inline)) {
            this.renderer.inline[key as TInline["type"]] = value as any;
          }
        }
      }

      if (loader) {
        if (loader.block) {
          for (const [key, value] of Object.entries(loader.block)) {
            this.loader.block[key as TBlock["type"]] = value as any;
          }
        }
        if (loader.inline) {
          for (const [key, value] of Object.entries(loader.inline)) {
            this.loader.inline[key as TInline["type"]] = value as any;
          }
        }
      }
    });
  }
}

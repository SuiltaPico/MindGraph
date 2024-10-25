import { Position } from "@/common/math";
import { createSignal } from "@/common/signal";
import { Plugin } from "./plugin";
import { Selection } from "./selection";
import { MaybePromise } from "@/common/async";
import {
  BlockSavedData,
  InlineSavedData,
  load_data,
  LoaderMap,
  save_data,
  SavedData,
} from "./save";
import { RendererMap } from "./renderer";
import {
  UnknownBlockRenderer,
  UnknownInlineRenderer,
} from "./renderer/MixEditorRenderer";
import { AreaContext } from "./AreaContext";

export type BaseArea = {
  save: () => MaybePromise<any>;
  get_child(index: number): MaybeArea;
  get_child_position(index: number): Position | void;
};
/** 块区域。 */
export type Block<TName extends string = any, TData = any> = BaseArea & {
  save: () => MaybePromise<BlockSavedData>;
  type: TName;
  data: TData;
};

/** 行内区域。 */
export type Inline<TName extends string = any, TData = any> = BaseArea & {
  save: () => MaybePromise<InlineSavedData>;
  type: TName;
  data: TData;
  tags: InlineTag[];
};

/** 行内标签。 */
export type InlineTag<TName extends string = any, TData = any> = BaseArea & {
  type: TName;
  data: TData;
};

export type Area = Block<any, any> | Inline<any, any> | InlineTag<any, any>;
export const NotArea = "not_area" as const;
export type MaybeArea = Area | typeof NotArea;

export type Metadata = {
  schema_version: number;
  updated_at: number;
};

export type Config = {
  plugins: Plugin[];
};

/** 富文本混合编辑器。 */
export class MixEditor<
  TBlock extends Block<any, any> = Block<any, any>,
  TInline extends Inline<any, any> = Inline<any, any>,
  TInlineTag extends InlineTag<any, any> = InlineTag<any, any>
> {
  selection = new Selection();
  blocks = createSignal<TBlock[]>([]);
  metadata = createSignal<Metadata | undefined>(undefined);

  area_context = new Map<Area, AreaContext>();
  root_area: Block<"root", {}> = {
    type: "root",
    data: {},
    save: () => ({
      type: "root",
      data: {},
    }),
    get_child: (index: number) => this.blocks.get()[index],
    get_child_position: (index: number) => undefined as Position | undefined,
  };
  root_context = new AreaContext(this.root_area, undefined, 0);

  loader: LoaderMap = {
    block: new Map(),
    inline: new Map(),
    inline_tag: new Map(),
  };
  renderer: RendererMap = {
    block: new Map(),
    inline: new Map(),
    inline_tag: new Map(),
  };

  get_block_renderer(type: TBlock["type"]) {
    return this.renderer.block?.get(type) ?? UnknownBlockRenderer;
  }

  get_inline_renderer(type: TInline["type"]) {
    return this.renderer.inline?.get(type) ?? UnknownInlineRenderer;
  }

  get_inline_tag_renderer(type: TInlineTag["type"]) {
    return this.renderer.inline_tag?.get(type) ?? (() => undefined);
  }

  get_position_of_path(path: number[]) {
    let area = this.root_area;
    for (let index = 0; index < path.length; index++) {
      const path_index = path[index];
      if (index === path.length - 1) return area.get_child_position(path_index);
      area = area.get_child(path_index) as Block<any, any>;
      if (!area) return undefined;
    }
  }

  async load(data: SavedData) {
    const { blocks, meta } = await load_data(data, this.loader);
    this.blocks.set(blocks);
    this.metadata.set(meta);
  }

  async save() {
    return await save_data(this.blocks.get());
  }

  constructor(config: Config) {
    const plugin_keys = ["renderer", "loader"] as const;
    config.plugins.forEach((plugin) => {
      for (const plugin_key of plugin_keys) {
        const plugin_value = plugin[plugin_key];
        if (plugin_value) {
          for (const [record_type, record] of Object.entries(plugin_value)) {
            if (!record) continue;
            for (const [key, value] of Object.entries(record)) {
              this[plugin_key][record_type as keyof LoaderMap].set(
                key as TBlock["type"],
                value as any
              );
            }
          }
        }
      }
    });
  }
}

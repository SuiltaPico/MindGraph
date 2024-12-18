import { Position } from "@/common/math";
import { createSignal } from "@/common/signal";
import { Area, Block, Inline, InlineTag } from "./Area";
import { AreaContext } from "./AreaContext";
import { Plugin } from "./plugin";
import { RendererMap } from "./renderer";
import {
  UnknownBlockRenderer,
  UnknownInlineRenderer,
} from "./renderer/MixEditorRenderer";
import { LoaderMapRecord, Saver } from "./save";
import { Selection } from "./selection";
import { CaretMoveEnterEventCommand } from "./event/CaretMoveEnter";
import { RootArea } from "./root";

export type MaybeArea = Area | undefined;

/** 元数据。 */
export type Metadata = {
  schema_version: number;
  updated_at: number;
};

export type Config = {
  plugins: Plugin[];
};

/** 富文本编辑器。 */
export class MixEditor<
  TBlock extends Block<any, any> = Block<any, any>,
  TInline extends Inline<any, any> = Inline<any, any>,
  TInlineTag extends InlineTag<any, any> = InlineTag<any, any>
> {
  selection = new Selection(this);
  /** 块。 */
  blocks = createSignal<TBlock[]>([], {
    equals: false,
  });
  /** 元数据。 */
  metadata = createSignal<Metadata | undefined>(undefined);

  /** 区域的上下文。 */
  area_context = new WeakMap<Area, AreaContext>();
  root_area = new RootArea(this);
  root_context = new AreaContext(this.root_area, undefined);

  mode = createSignal<"readonly" | "edit">("readonly");

  loader: LoaderMapRecord = {
    block: new Map(),
    inline: new Map(),
    inline_tag: new Map(),
  };
  renderer: RendererMap = {
    block: new Map(),
    inline: new Map(),
    inline_tag: new Map(),
  };

  saver = new Saver(this);

  get_block_renderer(type: TBlock["type"]) {
    return this.renderer.block?.get(type) ?? UnknownBlockRenderer;
  }

  get_inline_renderer(type: TInline["type"]) {
    return this.renderer.inline?.get(type) ?? UnknownInlineRenderer;
  }

  get_inline_tag_renderer(type: TInlineTag["type"]) {
    return this.renderer.inline_tag?.get(type) ?? (() => undefined);
  }

  get_context(area: Area) {
    return this.area_context.get(area);
  }

  constructor(config: Config) {
    this.area_context.set(this.root_area, this.root_context);

    const plugin_keys = ["renderer", "loader"] as const;
    const that = this;

    function load_plugin_record<
      TPluginKey extends (typeof plugin_keys)[number]
    >(plugin_key: TPluginKey, plugin: Plugin) {
      const maps_record_of_this = that[plugin_key] as any;
      const maps_record_of_plugin = plugin[plugin_key];
      if (!maps_record_of_plugin) return;
      for (const [record_type, record] of Object.entries(
        maps_record_of_plugin
      )) {
        if (!record) continue;
        for (const [key, value] of Object.entries(record)) {
          maps_record_of_this[record_type as keyof LoaderMapRecord].set(
            key as TBlock["type"],
            value as any
          );
        }
      }
    }

    config.plugins.forEach((plugin) => {
      for (const plugin_key of plugin_keys) {
        load_plugin_record(plugin_key, plugin);
      }
    });
  }
}

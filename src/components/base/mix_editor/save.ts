import { MaybePromise } from "@/common/async";
import { MaybeArea, Metadata, MixEditor } from "./MixEditor";
import { AreaMap, Block, Inline, InlineTag } from "./Area";
import { AreaContext } from "./AreaContext";
import { createSignal, WrappedSignal } from "@/common/signal";

export const schema_version = 1;

export type SavedDataRecord = {
  block: BlockSavedData;
  inline: InlineSavedData;
  inline_tag: InlineTagSavedData;
};

export type BlockSavedData<TData = any> = {
  type: string;
  data: TData;
};

export function create_BlockSaveData(type: string, data: any) {
  return {
    type,
    data,
  } satisfies BlockSavedData;
}

export type InlineSavedData<TData = any> = {
  type: string;
  data: TData;
  tags: InlineTagSavedData[];
};

export function create_InlineSaveData(
  type: string,
  data: any,
  tags: InlineTagSavedData[]
) {
  return {
    type,
    data,
    tags,
  } satisfies InlineSavedData;
}

export type InlineTagSavedData<TData = any> = {
  type: string;
  data: TData;
};

export function create_InlineTagSaveData(type: string, data: any) {
  return {
    type,
    data,
  } satisfies InlineTagSavedData;
}

export type AreaSavedData =
  | BlockSavedData
  | InlineSavedData
  | InlineTagSavedData;

export type SavedData = {
  blocks: BlockSavedData[];
  meta: Metadata;
};

export type BlockLoader<TData = any> = (
  data: BlockSavedData<TData>,
  editor: MixEditor<any, any>
) => MaybePromise<Block>;
export type InlineLoader<TData = any> = (
  data: InlineSavedData<TData>,
  editor: MixEditor<any, any>
) => MaybePromise<Inline>;
export type InlineTagLoader<TData = any> = (
  data: InlineTagSavedData<TData>,
  editor: MixEditor<any, any>
) => MaybePromise<InlineTag>;
export type AreaLoader = BlockLoader | InlineLoader | InlineTagLoader;

export type LoaderMap = {
  block: BlockLoader;
  inline: InlineLoader;
  inline_tag: InlineTagLoader;
};
export type LoaderMapRecord = {
  block: Map<string, BlockLoader>;
  inline: Map<string, InlineLoader>;
  inline_tag: Map<string, InlineTagLoader>;
};

export class LoadingErrorBlock
  implements
    Block<
      "loading_error",
      {
        reason: string;
        original: BlockSavedData;
      }
    >
{
  area_type = "block" as const;
  type = "loading_error" as const;
  save() {
    return this.data.original;
  }
  children_count() {
    return 0;
  }
  get_child() {
    return undefined;
  }
  get_child_position() {
    return undefined;
  }
  constructor(public data: { reason: string; original: BlockSavedData }) {}
}

export class LoadingErrorInline
  implements
    Inline<
      "loading_error",
      {
        reason: string;
        original: InlineSavedData;
        tags: WrappedSignal<InlineTag[]>;
      }
    >
{
  area_type = "inline" as const;
  type = "loading_error" as const;
  save() {
    return this.data.original;
  }
  children_count() {
    return 0;
  }
  get_child() {
    return undefined;
  }
  get_child_position() {
    return undefined;
  }
  constructor(
    public data: {
      reason: string;
      original: InlineSavedData;
      tags: WrappedSignal<InlineTag[]>;
    }
  ) {}
}

async function load_area(
  data: BlockSavedData | InlineSavedData | InlineTagSavedData,
  type: "block" | "inline" | "inline_tag",
  editor: MixEditor<any, any, any>
) {
  const loader = editor.loader[type].get(data.type) as
    | BlockLoader
    | InlineLoader
    | InlineTagLoader;
  if (!loader) {
    console.error(`${data.type} ${type} 区域加载器未定义。`);
    // return new LoadingErrorBlock({
    //   reason: `${data.type} 区域加载器未定义。`,
    //   original: data,
    // });
  }
  try {
    return await loader(data as any, editor);
  } catch (error) {
    console.error(error);
    // return new LoadingErrorBlock({
    //   reason: `${data.type} 区域解析失败。错误：${String(error)}`,
    //   original: data,
    // });
  }
}

async function load_areas<T extends "block" | "inline" | "inline_tag">(
  area_saved_datas: AreaSavedData[],
  type: T,
  editor: MixEditor<any, any, any>
) {
  const promises = area_saved_datas.map((it) => load_area(it, type, editor));
  return (await Promise.all(promises)).filter(
    (it) => it !== undefined
  ) as AreaMap[T][];
}

export async function save_data(blocks: Block[]): Promise<SavedData> {
  const promises = blocks.map((it) => it.save());
  const results = await Promise.all(promises);
  return {
    blocks: results,
    meta: {
      schema_version: schema_version,
      updated_at: Date.now(),
    },
  };
}

export async function save_inlines(inlines: Inline[]) {
  const promises = inlines.map((it) => it.save());
  return await Promise.all(promises);
}

export class Saver {
  async load_areas<T extends "block" | "inline" | "inline_tag">(
    type: T,
    areas_saved_data: AreaSavedData[],
    parent: MaybeArea
  ): Promise<AreaMap[T][]> {
    const areas = await load_areas(areas_saved_data, type, this.editor);
    for (const area of areas) {
      this.editor.area_context.set(area, new AreaContext(area, parent));
    }
    return areas;
  }

  async load_data(data: SavedData) {
    return {
      blocks: await this.load_areas(
        "block",
        data.blocks,
        this.editor.root_area
      ),
      meta: data.meta,
    };
  }

  async load(data: SavedData) {
    const { blocks, meta } = await this.load_data(data);
    this.editor.blocks.set(blocks);
    this.editor.metadata.set(meta);
  }

  async save() {
    return await save_data(this.editor.blocks.get());
  }

  constructor(private editor: MixEditor<any, any, any>) {}
}

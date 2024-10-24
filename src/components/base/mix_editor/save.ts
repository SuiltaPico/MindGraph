import { MaybePromise } from "@/common/async";
import { Block, Inline, InlineTag, MaybeArea, Metadata, NotArea } from "./MixEditor";
import { GetMapValue } from "@/common/types";

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

export type SavedData = {
  blocks: BlockSavedData[];
  meta: Metadata;
};

export type BlockLoader<TData = any> = (
  data: BlockSavedData<TData>,
  parser_map: LoaderMap
) => MaybePromise<Block>;
export type InlineLoader<TData = any> = (
  data: InlineSavedData<TData>,
  parser_map: LoaderMap
) => MaybePromise<Inline>;
export type InlineTagLoader<TData = any> = (
  data: InlineTagSavedData<TData>,
  parser_map: LoaderMap
) => MaybePromise<InlineTag>;

export type LoaderMap = {
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
  type = "loading_error" as const;
  save() {
    return this.data.original;
  }
  get_child() {
    return NotArea;
  }
  get_child_position() {
    return undefined;
  }
  constructor(public data: { reason: string; original: BlockSavedData }) {}
}

export class LoadingErrorInline
  implements
    Inline<"loading_error", { reason: string; original: InlineSavedData }>
{
  type = "loading_error" as const;
  tags = [];
  save() {
    return this.data.original;
  }
  get_child() {
    return NotArea;
  }
  get_child_position() {
    return undefined;
  }
  constructor(public data: { reason: string; original: InlineSavedData }) {}
}

export async function load_data(data: SavedData, parser_map: LoaderMap) {
  const promises = data.blocks.map((block) => load_block(block, parser_map));
  const blocks = await Promise.all(promises);
  return { blocks, meta: data.meta };
}

const gen_area_loader = <T extends "block" | "inline" | "inline_tag">(
  type: T
) => {
  return async (data: SavedDataRecord[T], parser_map: LoaderMap) => {
    console.log(parser_map);

    const loader = parser_map[type].get(data.type) as any;
    if (!loader) {
      console.error(`${data.type} ${type} 区域加载器未定义。`);
      return new LoadingErrorBlock({
        reason: `${data.type} 区域加载器未定义。`,
        original: data,
      });
    }
    try {
      return await loader(data as any, parser_map);
    } catch (error) {
      console.error(error);
      return new LoadingErrorBlock({
        reason: `${data.type} 区域解析失败。错误：${String(error)}`,
        original: data,
      });
    }
  };
};
export const load_block = gen_area_loader("block");
export const load_inline = gen_area_loader("inline");
export const load_inline_tag = gen_area_loader("inline_tag");

const gen_areas_loader = <T>(
  load_area: (data: any, parser_map: LoaderMap) => MaybePromise<T>
) => {
  return async (areas: any[], parser_map: LoaderMap) => {
    const promises = areas.map((it) => load_area(it, parser_map));
    return await Promise.all(promises);
  };
};

export const load_blocks = gen_areas_loader<Block>(load_block);
export const load_inlines = gen_areas_loader<Inline>(load_inline);
export const load_inline_tags = gen_areas_loader<InlineTag>(load_inline_tag);

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

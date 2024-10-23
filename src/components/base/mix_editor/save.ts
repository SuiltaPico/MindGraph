import { MaybePromise } from "@/common/async";
import { Block, Inline, NotArea } from "./MixEditor";

export const schema_version = 1;

export type BlockSavedData<TData = any> = {
  type: string;
  data: TData;
};

export function create_BlockSaveData(type: string, data: any) {
  return {
    type,
    data,
  };
}

export type InlineSavedData<TData = any> = {
  type: string;
  data: any;
};

export function create_InlineSaveData(type: string, data: any) {
  return {
    type,
    data,
  };
}

export type SavedData = {
  blocks: BlockSavedData[];
  metadata: {
    schema_version: number;
    updated_at: number;
  };
};

export type LoaderMap = {
  block: Map<string, BlockLoader>;
  inline: Map<string, InlineLoader>;
};

export type BlockLoader<TData = any> = (
  data: BlockSavedData<TData>,
  parser_map: LoaderMap
) => MaybePromise<Block>;
export type InlineLoader<TData = any> = (
  data: InlineSavedData<TData>,
  parser_map: LoaderMap
) => MaybePromise<Inline>;

export class LoadingErrorBlock
  implements
    Block<
      "error_block",
      {
        reason: string;
        original: BlockSavedData;
      }
    >
{
  type = "error_block" as const;
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

export async function load_data(data: SavedData, parser_map: LoaderMap) {
  const promises = data.blocks.map((block) => load_block(block, parser_map));
  return await Promise.all(promises);
}

export async function load_block(data: BlockSavedData, parser_map: LoaderMap) {
  const loader = parser_map.block.get(data.type);
  if (!loader) {
    return new LoadingErrorBlock({
      reason: `${data.type} 块区域加载器未定义。`,
      original: data,
    });
  }
  try {
    return await loader(data, parser_map);
  } catch (error) {
    return new LoadingErrorBlock({
      reason: `${data.type} 块区域解析失败。${String(error)}`,
      original: data,
    });
  }
}

export async function load_inline(
  data: InlineSavedData,
  parser_map: LoaderMap
) {
  const loader = parser_map.inline.get(data.type);
  if (!loader) {
    return new LoadingErrorBlock({
      reason: `${data.type} 行内区域加载器未定义。`,
      original: data,
    });
  }
  try {
    return await loader(data, parser_map);
  } catch (error) {
    return new LoadingErrorBlock({
      reason: `${data.type} 行内区域解析失败。${String(error)}`,
      original: data,
    });
  }
}

export async function load_inlines(
  inlines: InlineSavedData[],
  parser_map: LoaderMap
) {
  const promises = inlines.map((it) => load_inline(it, parser_map));
  return await Promise.all(promises);
}

export async function save_data(blocks: Block[]): Promise<SavedData> {
  const promises = blocks.map((it) => it.save());
  const results = await Promise.all(promises);
  return {
    blocks: results,
    metadata: {
      schema_version,
      updated_at: Date.now(),
    },
  };
}

export async function save_inlines(inlines: Inline[]) {
  const promises = inlines.map((it) => it.save());
  return await Promise.all(promises);
}

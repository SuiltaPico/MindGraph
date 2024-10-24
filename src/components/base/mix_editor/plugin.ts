import { BlockRenderer, InlineRenderer, InlineTagRenderer } from "./renderer";
import { BlockLoader, InlineLoader, InlineTagLoader } from "./save";

export type LoaderRecord = {
  block: Record<string, BlockLoader>;
  inline: Record<string, InlineLoader>;
  inline_tag: Record<string, InlineTagLoader>;
};

export type RendererRecord = {
  block: Record<string, BlockRenderer>;
  inline: Record<string, InlineRenderer>;
  inline_tag: Record<string, InlineTagRenderer>;
};

export type PluginFactory = (...args: any) => Plugin;

export type Plugin = {
  loader?: Partial<LoaderRecord>;
  renderer?: Partial<RendererRecord>;
};

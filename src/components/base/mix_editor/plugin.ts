import { JSX } from "solid-js";
import { Block, Inline, MixEditor } from "./MixEditor";
import { BlockRenderer, InlineRenderer, RendererMap } from "./renderer";
import { BlockLoader, InlineLoader, LoaderMap } from "./save";


export type LoaderRecord = {
  block: Record<string, BlockLoader>;
  inline: Record<string, InlineLoader>;
};

export type RendererRecord = {
  block: Record<string, BlockRenderer>;
  inline: Record<string, InlineRenderer>;
};

export type PluginFactory = (...args: any) => Plugin;

export type Plugin = {
  loader?: Partial<LoaderRecord>;
  renderer?: Partial<RendererRecord>;
};

import { JSX } from "solid-js";
import { MixEditor, Block, Inline, InlineTag } from "./MixEditor";
import { AreaContext } from "./AreaContext";

export type BlockRenderer<TBlock extends Block = any> = (props: {
  editor: MixEditor;
  block: TBlock;
  context: AreaContext;
}) => JSX.Element;

export type InlineRenderer<TInline extends Inline = any> = (props: {
  editor: MixEditor;
  inline: TInline;
  context: AreaContext;
}) => JSX.Element;

export type InlineTagRenderer<TInlineTag extends InlineTag = any> = (props: {
  editor: MixEditor;
  inline_tag: TInlineTag;
  context: AreaContext;
}) => JSX.Element;

export type RendererMap = {
  block: Map<Block["type"], BlockRenderer>;
  inline: Map<Inline["type"], InlineRenderer>;
  inline_tag: Map<InlineTag["type"], InlineTagRenderer>;
};

// import { async_throttle } from "@/common/async";
// import { createSignal, WrappedSignal } from "@/common/signal";
// import { EditorJSContent, IFullMindNode } from "@/domain/MindNode";
// import EditorJS, { OutputData } from "@editorjs/editorjs";
// import {
//   Component,
//   createEffect,
//   createMemo,
//   For,
//   Match,
//   onCleanup,
//   onMount,
//   Switch,
// } from "solid-js";
// import { Canvas } from "../../Canvas";
// import { MindNodeHelper } from "../../utils/Helper";
// import { decode } from "html-entities";

// function markdown_to_editorjs(markdown: string): OutputData {
//   return {
//     blocks: markdown.split("\n").map((line) => ({
//       type: "paragraph",
//       data: {
//         text: line,
//       },
//     })),
//   } satisfies OutputData;
// }

// export function node_content_to_editorjs(content: IFullMindNode["content"]) {
//   if (content._type === "markdown") {
//     return {
//       _type: "editorjs" as const,
//       value: markdown_to_editorjs(content.value),
//     };
//   }
//   return content;
// }

// function create_editorjs_save(data: OutputData) {
//   data.blocks.forEach((block) => {
//     block.data.text = decode(block.data.text);
//   });
//   return {
//     _type: "editorjs",
//     value: data,
//   };
// }

// export type EditorMode = "markdown_read" | "editorjs_read" | "editorjs_edit";

// export class Editor {
//   mode = createSignal<EditorMode>("markdown_read");
//   // 使用锁来解决异步保存导致的闪烁问题
//   mode_locked_count = 0;
//   next_mode: EditorMode | undefined;

//   lock_mode() {
//     this.mode_locked_count++;
//   }

//   unlock_mode() {
//     this.mode_locked_count--;
//     if (this.mode_locked_count === 0 && this.next_mode) {
//       this.mode.set(this.next_mode);
//       this.next_mode = undefined;
//     }
//   }

//   set_mode(mode: EditorMode) {
//     if (this.mode_locked_count > 0) {
//       this.next_mode = mode;
//     } else {
//       this.mode.set(mode);
//     }
//   }

//   handle_change = async_throttle(
//     async (fn: () => Promise<IFullMindNode["content"]>) => {
//       console.log("change");

//       const result = await fn();
//       this.canvas.mark_modified(this.node_helper.node.id);
//       this.node_helper.set_prop("content", result);

//       console.log("change end");
//     },
//     100
//   );

//   constructor(
//     public node_helper: MindNodeHelper,
//     public canvas: Canvas,
//     public editing: WrappedSignal<boolean>
//   ) {
//     createEffect(() => {
//       if (editing.get()) {
//         this.set_mode("editorjs_edit");
//       } else {
//         const content_type = node_helper.get_prop("content")._type;
//         if (content_type === "markdown") {
//           this.set_mode("markdown_read");
//         } else {
//           this.set_mode("editorjs_read");
//         }
//       }
//     });
//   }
// }

// export const MarkdownReadMode: Component<{ editor: Editor }> = (props) => {
//   return props.editor.node_helper.node.content.value as string;
// };

// export const EditorJSReadMode: Component<{ editor: Editor }> = (props) => {
//   const content = createMemo(
//     () => props.editor.node_helper.get_prop("content") as EditorJSContent
//   );
//   const blocks = createMemo(() => content().value.blocks);
//   return (
//     <div>
//       <For each={blocks()}>{(block) => <div>{block.data.text}</div>}</For>
//     </div>
//   );
// };

// export const EditorJSEditMode: Component<{ editor: Editor }> = (props) => {
//   const editor = props.editor;
//   let container: HTMLDivElement;
//   let editor_js: EditorJS | undefined;
//   onMount(() => {
//     editor_js = new EditorJS({
//       holder: container,
//       data: node_content_to_editorjs(editor.node_helper.node.content).value,
//       minHeight: 0,
//       autofocus: true,
//       onChange: async (api) => {
//         editor.lock_mode();
//         await editor.handle_change(async () =>
//           create_editorjs_save(await api!.saver.save())
//         );
//         editor.unlock_mode();
//       },
//     });
//   });
//   onCleanup(() => {
//     editor_js?.destroy();
//   });
//   return (
//     <div
//       ref={(it) => (container = it)}
//       onInput={async () => {
//         await editor_js?.isReady;

//         editor.lock_mode();
//         console.log(await editor_js!.save());
//         await editor.handle_change(async () =>
//           create_editorjs_save(await editor_js!.save())
//         );
//         editor.unlock_mode();
//       }}
//     ></div>
//   );
// };

// export const EditorRenderer: Component<{ editor: Editor }> = (props) => {
//   const editor = props.editor;
//   const mode = editor.mode;
//   return (
//     <>
//       <Switch>
//         <Match when={mode.get() === "markdown_read"}>
//           <MarkdownReadMode editor={editor} />
//         </Match>
//         <Match when={mode.get() === "editorjs_read"}>
//           <EditorJSReadMode editor={editor} />
//         </Match>
//         <Match when={mode.get() === "editorjs_edit"}>
//           <EditorJSEditMode editor={editor} />
//         </Match>
//       </Switch>
//     </>
//   );
// };

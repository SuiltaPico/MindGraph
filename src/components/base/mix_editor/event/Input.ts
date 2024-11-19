import { MaybePromise } from "@/common/async";
import { Area } from "../Area";
import { BaseEvent } from "../event";
import { Selection } from "../selection";

export type InputEventCommand =
  | {
      type: "done";
      /** 输入的结束位置。 */
      to: number;
    }
  | {
      type: "skip";
    }
  | {
      type: "enter_child";
      index: number;
      /** 输入的结束位置。 */
      to: number;
    };

export const InputEventCommand = {
  /** 不接受输入，跳过当前节点。 */
  skip: { type: "skip" } satisfies InputEventCommand,
  /** 接受输入，并把光标移动到指定位置。 */
  done: (to: number) => ({ type: "done", to } satisfies InputEventCommand),
  /** 接受输入，并把光标移动到指定位置。 */
  enter_child: (index: number, to: number) =>
    ({ type: "enter_child", index, to } satisfies InputEventCommand),
};

export interface InputValue {
  text: string;
  /** 输入的剪切板数据。 */
  dataTransfer?: DataTransfer;
}

/** 输入事件。 */
export interface InputEvent extends BaseEvent {
  event_type: "input";
  /** 输入的值。 */
  value: InputValue;
  /** 输入的位置。 */
  to: number;
}

export type InputEventPair = {
  event: InputEvent;
  result: MaybePromise<InputEventCommand>;
};

export async function input_enter_child(
  area: Area,
  index: number,
  to: number,
  value: InputValue
) {
  const child = area.get_child(index);
  if (!child) return;

  const result = await child.handle_event?.<InputEventPair>({
    event_type: "input",
    value,
    to: to,
  });

  return { result, area: child };
}

export async function handle_input_event_command(
  selection: Selection,
  command: void | InputEventCommand | undefined,
  area: Area,
  value: InputValue
) {
  while (true) {
    if (!command || command.type === "skip") break;

    console.log(`handle_input_result`, command, area, value);

    if (command.type === "done") {
      selection.collapsed_select({
        area,
        child_path: command.to,
      });
      return true;
    } else if (command.type === "enter_child") {
      const result = await input_enter_child(
        area,
        command.index,
        command.to,
        value
      );
      if (!result) {
        command = undefined;
      } else {
        area = result.area;
        command = result.result;
      }
    }
  }
}

/** 输入到选区。 */
export async function input_to_selection(
  selection: Selection,
  value: InputValue
) {
  const selected = selection.selected.get();
  const editor_mode = selection.editor.mode.get();
  if (!selected || editor_mode !== "edit") return;
  if (selected?.type === "collapsed") {
    let current_area = selected.start.area;
    let result = await current_area.handle_event?.<InputEventPair>({
      event_type: "input",
      value,
      to: selected.start.child_path,
    });

    return await handle_input_event_command(selection, result, current_area, value);
  }
}

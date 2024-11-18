import { MixEditor } from "../MixEditor";
import { BreakLineEventPair } from "./BreakLine";
import { CaretMoveEnterEventPair } from "./CaretMoveEnter";
import { CombineEventPair } from "./Combine";
import { DeleteEventPair } from "./Delete";
import { EnterEventPair } from "./Enter";
import { InputEventPair } from "./Input";

export type BaseEvent = {
  event_type: string;
};

export type EventPair =
  | CaretMoveEnterEventPair
  | InputEventPair
  | DeleteEventPair
  | CombineEventPair
  | EnterEventPair
  | BreakLineEventPair;

export type MixEditorEvent = EventPair["event"];

import { MixEditor } from "../MixEditor";
import { CaretMoveEnterEventPair } from "./CaretMoveEnter";
import { CombineEventPair } from "./Combine";
import { DeleteEventPair } from "./Delete";
import { InputEventPair } from "./Input";

export type BaseEvent = {
  event_type: string;
};

export type EventPair =
  | CaretMoveEnterEventPair
  | InputEventPair
  | DeleteEventPair
  | CombineEventPair;

export type MixEditorEvent = EventPair["event"];

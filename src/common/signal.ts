import {
  Accessor,
  Setter,
  createSignal as solid_createSignal
} from "solid-js";

export class WrappedSignal<T> {
  get: Accessor<T>;
  set: Setter<T>;
  constructor([get, set]: ReturnType<typeof solid_createSignal<T>>) {
    this.get = get;
    this.set = set;
  }
}

export function createSignal<T>(
  ...args: Parameters<typeof solid_createSignal<T>>
) {
  const [get_signal, set_signal] = solid_createSignal(...args);
  return new WrappedSignal([get_signal, set_signal]);
}

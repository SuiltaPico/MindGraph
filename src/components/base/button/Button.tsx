import clsx from "clsx";
import { JSX, ParentComponent, splitProps } from "solid-js";
import "./Button.css";

export const Button: ParentComponent<
  {} & JSX.ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => {
  const [_, other] = splitProps(props, ["class"]);
  return <button class={clsx("_m_btn", props.class)} {...other}></button>;
};

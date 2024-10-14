import { clsx } from "clsx";
import { JSX, ParentComponent, splitProps } from "solid-js";

function generate_RowCol(
  type: "col" | "row"
): ParentComponent<Omit<JSX.HTMLAttributes<HTMLDivElement>, "classList">> {
  return (props) => {
    const [p, others] = splitProps(props, ["class"]);

    return (
      <div
        ref={props.ref}
        class={clsx(p.class, `flex flex-${type}`)}
        {...others}
      ></div>
    );
  };
}

export const Row = generate_RowCol("row");
export const Column = generate_RowCol("col");

export const FlexSpace: ParentComponent<
  Omit<JSX.HTMLAttributes<HTMLDivElement>, "classList">
> = (props) => {
  const [p, others] = splitProps(props, ["class"]);
  return (
    <div class={clsx(p.class, `flex-grow`)} ref={props.ref} {...others}></div>
  );
};

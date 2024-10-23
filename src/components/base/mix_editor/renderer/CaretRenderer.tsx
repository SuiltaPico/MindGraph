import { CaretRendererType } from "../selection";

export const CaretRenderer: CaretRendererType = (props) => {
  return (
    <div class="__caret_layer">
      <div class="__caret">
        <input />
      </div>
    </div>
  );
};

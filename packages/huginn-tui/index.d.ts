import { MultiSelectRenderable } from "./src/MultiSelect";

declare module "@opentui/react" {
   interface OpenTUIComponents {
      multiselect: typeof MultiSelectRenderable;
   }
}

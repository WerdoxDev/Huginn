import binding from "bindings";

let native;
if (process.env.NODE_ENV === "production") {
   native = binding({ bindings: "huginn_addon", module_root: "native-addon" });
} else {
   native = binding("huginn_addon");
}
export default new native.HuginnAddon();

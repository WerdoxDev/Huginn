import binding from "bindings";

const native = binding({ bindings: "my_addon", module_root: "native-addon" });
export default new native.MyAddon();

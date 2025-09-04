import binding from "bindings";

const addon = binding({
   try: [
      ["build", "Release", "huginn_addon.node"],
      ["native-addon", "build", "Release", "huginn_addon.node"],
   ],
});

export default addon;

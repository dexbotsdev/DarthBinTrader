import caxa from "caxa";

(async () => {
    await caxa({
      input: ".",
      output: "run",
      command: [
        "{{caxa}}/node_modules/.bin/node",
        "{{caxa}}/index.js",
        "DarthBinTrader", 
      ],
    });
  })();
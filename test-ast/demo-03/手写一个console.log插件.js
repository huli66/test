/**
 * 在控制台第一时间定位到日志输出位置插件
 * 原理：给所有 console.log 添加参数：当前文件名，具体代码位置
 * console.log('Hello', '当前文件名', '源码位置信息');
 *
 * 对比 AST 树可以发现，只有 arguments 略有不同
 */

const core = require("@babel/core");
const types = require("@babel/types");
const path = require("path");

const sourceCode = `() => console.log('hello')`;

const consoleLogPlugin = {
  visitor: {
    CallExpression(path, state) {
      const { node } = path;

      if (core.types.isMemberExpression(node.callee)) {
        if (node.callee.object.name === "console") {
          // 找到了 console
          if (
            ["log", "warn", "info", "error"].includes(node.callee.property.name)
          ) {
            // 定位 console.log
            const { line, column } = node.loc.start; // 找到代码所处行列
            node.arguments.push(types.stringLiteral(`${line}:${column}`));
            // 找到文件名并添加到 arguments
            const filename = state.file.opts.filename;
            // const relativeName = path
            //   .relative(__dirname, filename)
            //   .replace(/\\/g, "/"); // 兼容 windows
            // node.arguments.push(types.stringLiteral(relativeName));
            node.arguments.push(types.stringLiteral(filename));
          }
        }
      }
    },
  },
};

let target = core.transform(sourceCode, {
  plugins: [consoleLogPlugin],
  filename: "hello.js", // 模拟环境
});

console.log(target.code);

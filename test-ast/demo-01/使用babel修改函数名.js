/**
 * 使用 babel 修改函数名
 */

const parser = require("@babel/parser");
const traverse = require("@babel/traverse");
const generator = require("@babel/generator");

// 源代码
const sourceCode = `const hello = () => {}`;

// 1.转换成 ast
const ast = parser.parse(sourceCode);

// 2.写一个处理函数的 AST
const visitor = {
  // traverse 会遍历树节点，只要节点的 type 在 visitor 对象中出现，就会调用该方法
  Identifier(path) {
    const { node } = path;
    if (node.name === "hello") {
      node.name = "hi";
    }
  },
};

// 3.遍历 AST
traverse.default(ast, visitor);
// 4.生成
const result = generator.default(ast, sourceCode);

console.log(result.code, result);

/**
 * 手写箭头函数转换插件
 */

const core = require("@babel/core");
const types = require("@babel/types");

const sourceCode = `
const sum = (a, b) => {
  return a + b;
}
`;
const sourceCode2 = `
const sum = (a, b) => a + b
`;
const sourceCode3 = `
const sum = (a, b) => {
  console.log(this);
  return a + b;
}
`;

// const babelPlugin = {
//   visitor: {
//     [type]: (path) => {
//       // xxx
//     }
//   }
// }
// 把修改函数名也做成插件形式
const changeFunctionName = {
  visitor: {
    Identifier: (path) => {
      const { node } = path;
      if (node.name === "sum") {
        node.name = "hi";
      }
    },
  },
};

function hoistFunctionEnvironment(path) {
  // 确定当前箭头函数使用的 this 是哪个地方的
  const thisEnv = path.findParent((parent) => {
    return (
      (parent.isFunction() && !parent.isArrowFunctionExpression()) ||
      parent.isProgram()
    ); // 要求父节点是函数且不是箭头函数，否则返回根节点
  });

  // 第二步：向父作用域加入 _this 变量
  // 想在作用域中添加一个变量，其实就是对 AST 树中的 scope 新增一个节点即可
  thisEnv.scope.push({
    id: types.identifier("_this"), // 生成标识符节点，即变量名
    init: types.thisExpression(), // 生成 this 节点，变量值
  });

  // 第三步，找出当前箭头函数所有用的 this 的地方
  let thisPaths = []; // 存放当前节点所有使用 this 的路径

  // 遍历当前节点的子节点
  path.traverse({
    ThisExpression(thisPath) {
      thisPaths.push(thisPath);
    },
  });

  // 替换
  thisPaths.forEach((thisPath) => {
    thisPath.replaceWith(types.identifier("_this")); // this => _this
  });
}

// 箭头函数转换插件
const arrowFunctionPlugin = {
  visitor: {
    ArrowFunctionExpression(path) {
      let { node } = path;
      hoistFunctionEnvironment(path); // 解决 this 作用域问题

      node.type = "FunctionExpression"; // 把箭头函数表达式改成普通函数表达式

      // 判断函数体是否是语句块，处理简写形式箭头函数
      if (!types.isBlockStatement(node.body)) {
        node.body = types.blockStatement([types.returnStatement(node.body)]); // 生成一个语句块并且 return
      }
    },
  },
};

let target = core.transform(sourceCode, {
  plugins: [arrowFunctionPlugin, changeFunctionName],
});

let target2 = core.transform(sourceCode2, {
  plugins: [arrowFunctionPlugin],
});

let target3 = core.transform(sourceCode3, {
  plugins: [arrowFunctionPlugin],
});

console.log(target);
console.log(target.code);
console.log("target2---", target2.code);
console.log("target3---", target3.code);

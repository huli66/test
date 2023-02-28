/**
 * 场景：监控系统日志上传过程中，需要往每个函数的作用域中添加一行日志执行函数
 * 函数定义有四种方式：箭头、函数定义、函数表达式、class 中
 *
 * 第一步：先判断源代码中是否引入了logger库
 * 第二步：如果引入了，就找出导入的变量名，后面直接使用该变量名即可
 * 第三步：如果没有引入我们就在源代码的顶部引用一下
 * 第四步：在函数中插入引入的函数
 */

const core = require("@babel/core"); //babel核心模块
let types = require("@babel/types"); //用来生成或者判断节点的AST语法树的节点

let sourceCode = `
  //四种声明函数的方式
  function sum(a, b) {
    return a + b;
  }
  const multiply = function (a, b) {
    return a * b;
  };
  const minus = (a, b) => a - b;
  class Calculator {
    divide(a, b) {
      return a / b;
    }
  }
`;

const autoInsertLogPlugin = {
  visitor: {
    Program(path, state) {
      let loggerId;
      path.traverse({
        ImportDeclaration(path) {
          const { node } = path;
          if (node.source.value === "logger") {
            // 不同情况取名字不同
            const specifiers = node.specifiers[0];
            loggerId = node.specifiers.local.name;
            path.stop(); // 找到了就停止遍历
          }
        },
      });

      if (!loggerId) {
        // 如果没有，说明源码没有导入此模块，需要手动插入 import 语句
        loggerId = path.scope.generateUid("loggerLib"); // 防止冲突
        path.node.body.unshift(
          types.importDeclaration(
            [types.importDefaultSpecifier(types.identifier(loggerId))],
            types.stringLiteral("logger")
            // 也可以用 teimplate.statement(`import ${loggerId} from 'logger'`)() 生成节点
          )
        );
      }

      // 在 state 上挂一个节点 => loggerLib()
      state.loggerNode = types.expressionStatement(
        types.callExpression(types.identifier(loggerId), [])
      );
    },
    //四种函数方式，这是插件能够识别的语法，这是四种函数的type
    "FunctionDeclaration | FunctionExpression | ArrowFunctionExpression | ClassMethod"(
      path,
      state
    ) {
      const { node } = path;
      if (types.isBlockStatement(node.body)) {
        //如果是一个块级语句的话
        node.body.body.unshift(state.loggerNode); //在语句的头部添加logger函数节点
      } else {
        //处理箭头函数，生成一个块级语句，在第一行中插入loggerNode，然后return 之前的内容
        const newBody = types.blockStatement([
          state.loggerNode,
          types.returnStatement(node.body),
        ]);
        //替换老节点
        node.body = newBody;
      }
    },
  },
};

let target = core.transform(sourceCode, {
  plugins: [autoInsertLogPlugin],
});

console.log(target.code);

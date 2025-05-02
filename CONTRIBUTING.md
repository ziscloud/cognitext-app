# 为 CogniText 贡献指南 🛠️

感谢您对 **CogniText** 的兴趣！以下是参与贡献的完整流程说明。

---

## 🚦 贡献流程

### 1. 准备工作
- **Fork 仓库**：点击 GitHub 页面的 "Fork" 按钮创建您的副本
- **克隆仓库**：
  ```bash
  git clone https://github.com/ziscloud/cognitext.git
  cd cognitext

### 2. 分支规范

- **主分支**：main（仅接受经过测试的 PR）
- **开发分支**：develop（主要开发分支，建议从此创建新分支）
- **命名规则**：
   ```bash
    git checkout -b feat/your-feature   # 新功能
    git checkout -b fix/your-bug        # Bug 修复
    git checkout -b docs/your-update    # 文档改进
   ```

---

## 💻 开发环境配置

### 依赖安装
```bash
# 全局安装 Neutralinojs CLI
npm install -g @neutralinojs/neu

# 安装项目依赖
npm install
```

### 启动开发服务器
```bash
neu run  # 同时启动前端和 Neutralinojs 后端
```

### 调试工具

- 前端：浏览器开发者工具（自动映射至 Neutralino 窗口）
- 后端日志：查看终端输出的 Neutralinojs 日志

---

## 📜 代码规范

### 代码风格

* ESLint：运行 npm run lint 检查代码规范
* Prettier：提交前自动格式化（已预配置）
* TypeScript：严格模式启用，禁止 any 类型

### React 组件规范

* 函数组件优先，使用 React.FC 类型
* 状态管理：Zustand 作为全局状态库
* 组件命名：PascalCase + .tsx 后缀

### Neutralinojs 交互

* 前端与 Neutralino 的 IPC 通信需封装至 /src/core/api 目录
* 避免直接访问 Neutralino 全局对象，使用预设 hooks

## ✉️ 提交信息规范

遵循 Conventional Commits 标准：

```bash
git commit -m "feat: 添加实时AI语法检查功能"
git commit -m "fix(editor): 修复代码块渲染溢出问题 #123"
```
### 类型清单：

| 类型 | 适用场景 |
|feat	| 新功能|
|fix	| Bug 修复|
|docs	| 文档更新|
|refactor| 	代码重构（不改变功能）|
|perf	| 性能优化|
|test	| 测试相关|
|chore	| 构建/依赖调整|

---

## 🧪 测试要求

### 单元测试
```bash
npm test  # 运行 Jest 测试套件
```

### E2E 测试（即将推出）
```bash
npm run test:e2e  # 使用 Playwright 进行端到端测试
```

### 覆盖率要求：

* 核心模块（AI 集成、文件操作）需 ≥80% 覆盖率
* UI 组件需提供基础交互测试

---

## 🐛 报告问题

请在 [GitHub Issues](https://github.com/ziscloud/cognitext/issues) 提交问题，必须包含：
1. 环境信息：
    ```plaintext
    OS: macOS 12.4 / Windows 11 22H2
    Node: v18.12.0
    Neu CLI: 9.3.0
    ```
2. 复现步骤：明确的操作序列
3. 预期与实际结果：附对比说明
4. 截图/日志：控制台错误日志或界面截图

---

## 🛡️ 行为准则

本项目遵循 贡献者公约，请确保：

* 使用包容性语言
* 尊重不同的技术观点
* 向新贡献者提供建设性反馈

如有问题请联系：maintainer@cognitext.dev

**🙌 感谢您的贡献！您的代码将帮助全球的创作者更高效地写作 🚀**

---

### 关键设计点
1. **Neutralinojs 专属指引**  
   强调全局 CLI 安装和 IPC 通信规范，避免混合架构常见问题

2. **TypeScript 严格模式**  
   通过禁用 `any` 类型提升代码质量，降低维护成本

3. **可扩展的测试策略**  
   区分单元测试与未来 E2E 测试，设定核心模块覆盖率门槛

4. **开发者体验优化**  
   提供问题报告模板和预配置的格式化工具，降低贡献门槛

建议配合 GitHub 的 [Issue 模板](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository) 功能进一步规范化协作流程。

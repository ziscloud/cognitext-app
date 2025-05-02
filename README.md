# CogniText ✨

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/cognitext/build.yml?branch=main)](https://github.com/yourusername/cognitext/actions)

**AI-Powered Markdown Editor for Thoughtful Writing**  
*Lightweight, Cross-Platform, and Open Source*

![CogniText Screenshot](./screenshot.png) <!-- 需替换为实际截图路径 -->

---

## 🌟 Features

### **AI-Enhanced Writing**
- **Smart Autocomplete**: GPT-4 驱动上下文感知补全（需配置 API Key）
- **CogniScan**: 实时语法/逻辑检查与风格优化建议
- **TextGenie**: 一键生成摘要、扩写或简化段落

### **Pure Markdown Experience**
- Typora 风格即时渲染 + 源码模式双视图
- LaTeX 公式、流程图、时序图支持
- 专注模式 + 深色/浅色主题切换

### **Developer Friendly**
- 基于 **React 18** + **Tauri** 的跨平台架构（<5MB 内存占用）
- 插件系统支持 AI 扩展（示例：`cognitext-chatgpt-plugin`）
- 完全开源，支持自定义 CSS 与快捷键

---

## 🛠️ Tech Stack

| 模块              | 技术选型                          |
|-------------------|----------------------------------|
| **核心框架**       | Neutralinojs (轻量跨平台桌面运行时) |
| **前端渲染**       | React 18 + TypeScript            |
| **构建工具**       | Crepe (基于 Vite 的 Neutralino 优化模板) |
| **AI 集成**        | OpenAI API / Llama.cpp (本地推理) |
| **Markdown 引擎**  | Remark + Rehype 生态链           |
| **样式系统**       | Tailwind CSS + PostCSS           |

---

## 🚀 Quick Start

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm run tauri dev
```

### 构建应用
```bash
pnpm run tauri build
# 输出至 ./dist 目录
```

---

## 🤝 贡献指南

欢迎提交 PR 或 Issue！推荐流程：

1. Fork 项目并创建分支 (feat/your-feature 或 fix/your-bug)
2. 遵循代码风格：ESLint + Prettier 已预配置
3. 提交前运行测试：
   ```bash
    pnpm test
   ```

---

## 📍 路线图

* v0.8 Alpha
  基础编辑器 + OpenAI 集成
* v0.9 Beta
  插件系统 + 本地 AI 模型支持
* v1.0 Release
  应用商店上架 + 团队协作模式

---

##  📜 开源协议

Apache 2.0 License - 详见 [LICENSE](LICENSE) 文件。

---

### ✨ README 设计要点
1. **技术栈透明化**  
   明确标注 Neutralinojs 的轻量化优势（对比 Electron），吸引注重性能的开发者

2. **AI 功能分层**  
   区分云端（OpenAI）和本地（Llama.cpp）方案，兼顾不同用户需求

3. **开发者友好**  
   Crepe 模板的预配置可大幅降低构建难度，需在文档中强调「5分钟快速启动」

4. **社区扩展性**  
   预留插件系统和自定义 CSS 说明，鼓励生态建设

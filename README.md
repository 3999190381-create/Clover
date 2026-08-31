# Clover

Clover 是一个基于 Onyx/Danswer 二次开发的开源、自托管 AI 知识库与对话平台，面向个人和团队提供统一的企业知识检索、智能问答和 Agent 工作流能力。

## 核心能力

- **RAG 与知识图谱检索**：对上传文件及外部数据源进行混合检索、重排序和知识关联。
- **智能 Agent**：支持自定义系统指令、知识库、工具和外部操作，构建可复用的专业助手。
- **联网搜索与深度研究**：接入 Web Search，通过多步检索生成带依据的研究型回答。
- **MCP 与 Actions**：通过 MCP/OpenAPI 等方式连接外部系统和业务工具。
- **多数据源连接器**：支持 40+ 常见应用和企业知识源的同步与权限继承。
- **代码解释器与多模态能力**：执行代码、分析数据、生成图表和文件，并支持图像生成。
- **团队协作与管理**：提供会话分享、反馈、用户管理、角色权限、用量统计和审计能力。

## 中文化

Web 前端已接入 `next-intl` 国际化框架，支持 English / 中文切换，中文语言包位于 `web/messages/zh.json`。主要聊天、知识库、Agent、搜索、MCP、管理后台、设置和引导流程均已提供中文词条；新增界面应优先通过语言包接入，避免硬编码 UI 文案。

## 目录结构

```text
backend/       后端 API、检索、连接器和任务服务
web/           Next.js Web 前端与国际化资源
desktop/       桌面端
widget/        可嵌入式聊天组件
deployment/    Docker、Kubernetes、Terraform 等部署配置
```

## 快速开始

推荐使用 Docker Compose 启动本地开发环境。详细步骤请参考 `deployment/` 目录及 `web/README.md`。

```bash
cd deployment/docker_compose
./install.sh
```

启动后可在浏览器访问 Web 前端，根据引导完成模型和数据源配置。

## 开发与验证

```bash
cd web
npm ci
npm run lint
npm run build
```

提交新的 UI 时，请同步更新 `web/messages/en.json` 和 `web/messages/zh.json`，并在聊天、知识库、Agent、管理后台等主要页面验证中英文切换。

## 许可证

本项目沿用上游项目的 MIT 许可证，详见 [LICENSE](LICENSE)。

## 项目地址

[https://github.com/3999190381-create/Clover](https://github.com/3999190381-create/Clover)

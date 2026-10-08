---
title: 'CI-CD'
description: '为 Node 22、npm 和 Next.js 16 设计可复制的 GitHub Actions 质量门禁、受控 Vercel 部署与回滚流程，明确凭据、现有 lint 阻断和构建网络前提。'
updatedAt: '2026-10-02'
module: '工程化'
order: 8
status: 'done'
---

# CI-CD

## 一、是什么

CI（持续集成）在代码变更时自动验证可集成性。
CD 可以表示持续交付，也可以表示持续部署；前者允许人工批准后发布，后者自动推送到生产。

本文采用“自动质量检查 + 人工触发生产发布”的持续交付模式。
示例提供可复制的 GitHub Actions 配置，但本站目前没有实际 workflow，也没有因此触发部署。

质量门禁不是在日志里打印“检查失败”，而是让失败步骤以非零状态退出，并阻止后续发布。
一个 workflow 文件语法正确，不代表依赖、网络、凭据、测试和部署目标都已准备好。

## 二、为什么

本地通过却在 CI 失败，常见原因不是 GitHub Actions 本身，而是隐含前提不同：

- 本地有未提交文件，CI 只看到被检出的 Git 提交。
- 本地缓存掩盖依赖缺失，CI 按锁文件重新安装。
- 开发模式没有执行生产优化、静态生成或完整类型检查。
- 构建依赖外部字体、图片或 API，CI 网络不允许访问。
- 平台构建环境变量与质量检查环境不一致。

因此流水线应描述“从哪个提交、用什么环境、得到什么产物、如何批准与回退”。
不能只写 checkout 和 build，就声称已经实现安全持续部署。

## 三、核心原理

### 真实仓库基线

以下结论来自本仓库配置核对，而非通用模板假设：

| 项目         | 当前事实                                 | 对流水线的影响                                               |
| ------------ | ---------------------------------------- | ------------------------------------------------------------ |
| `.nvmrc`     | `22.14.0`                                | CI 读取该文件，不随 runner 默认 Node 漂移                    |
| npm          | 本次环境为 `10.9.2`                      | 示例显式安装此版本以复现，不声称仓库已有 packageManager 字段 |
| 锁文件       | `package-lock.json`，lockfileVersion 3   | 使用 `npm ci`，不在 CI 重写锁文件                            |
| Next / React | `16.1.7` / `19.2.3`                      | App Router；Next 16 默认 Turbopack                           |
| lint         | `npm run lint` 执行 `eslint`             | 直接运行 ESLint，不使用已移除的 Next lint 子命令             |
| 类型检查     | strict TypeScript，没有 typecheck script | 使用本地安装的 `tsc --noEmit`                                |
| 测试         | 没有 test script 或测试框架依赖          | 提供真实内容冒烟断言，不伪造 `npm test` 已存在               |
| 构建与启动   | `next build` / `next start`              | 不是默认静态导出，不能直接扔到 GitHub Pages                  |
| Next 配置    | 空配置，没有 standalone 或 export        | 部署平台必须支持 Next 服务端能力                             |

Node 与 npm 的固定版本用于复现当前仓库，不代表它们是最新安全版本。
后续运行时升级应独立审查并更新基线，不能在内容任务中擅自改动配置。

本次实测 `npm run lint` 返回 **1 个错误、15 个警告**。
错误在 `app/components/HeroParticles.tsx` 的显式 `any`，其他警告涉及 PnP 文件及生成脚本。
这些问题不属于本文的修改范围，但复制后的质量门禁应如实失败，修复后才能发布。
禁止加 `continue-on-error`、`|| true` 或临时 ignore 让红灯变绿。

此外，现有 `lint-staged` 还保留旧 `next lint --fix` 配置，是需要另行修复的本地钩子债务。
CI 不调用该旧配置，而是直接调用有效的 `npm run lint`；也不修改或绕过本地提交钩子。

### 分离验证与发布权限

```text
PR / push / 手工触发
          |
          v
checkout 固定提交 -> Node/npm -> npm ci
          |
          v
类型检查 -> ESLint -> 内容冒烟 -> next build
          |
          +-- 任一步失败 -----------------> 停止
          |
          v
仅 main 手工请求生产部署
          |
   production 环境审批
          |
          v
拉取生产环境 -> 平台格式构建 -> 部署预构建产物
          |
          v
验收 URL / 告警 -> 必要时回滚旧部署
```

PR 检查不需要部署 secret，尤其不能用 `pull_request_target` 检出并执行不可信 PR 代码。
生产 job 只执行受保护 main 分支上的同一提交，并由环境审批限制授权。
分支保护还应把质量 job 设为必需检查；仅存在 YAML 不会自动禁止合并。

### 缓存不等于产物

`actions/setup-node` 的 npm 缓存保存包管理器下载数据，不是 `node_modules`。
即使命中缓存也必须执行 `npm ci`，让安装结果遵循锁文件。

`.next/cache` 是构建加速缓存，不能直接当部署包。
Next 的 `.next` 与 Vercel 的 `.vercel/output` 也不是可互换格式。
本文先只缓存 npm，避免一开始引入跨分支构建缓存和敏感环境污染问题。

## 四、实践

### 复制前必须准备什么

质量检查只需启用 GitHub Actions 和托管 runner，可使用 GitHub 自动提供的只读 token。
若依赖私有 npm 包，还需要相应 registry 凭据；当前仓库不额外假定这一点。

生产部署选择 **Vercel CLI 的 pull → build → deploy --prebuilt**，不使用含糊的“执行 deploy.sh”。
先由维护者在 Vercel 创建 Next.js 项目，并完成以下准备：

1. 确认 Root Directory 是仓库根，Framework Preset 为 Next.js，Node 主版本选 22。
2. 安装命令设置为 `npm ci`，Build Command 设置为 `npm run build`。
3. 配置生产构建与运行时所需环境变量；浏览器公开变量必须在构建前确定。
4. 获取 `VERCEL_ORG_ID`、`VERCEL_PROJECT_ID` 和有权限的 `VERCEL_TOKEN`。
5. 在 GitHub 创建 `production` Environment，限制 main 分支并配置可用的审批规则。
6. 将三个凭据存入该 Environment 的 secrets，设置完整版本号变量 `VERCEL_CLI_VERSION`。
7. 从官方 CLI 发布中选择并预先验证一个支持本项目的版本，如 `x.y.z` 格式的实际版本；不要填写字面量 `x.y.z`。

Org/Project ID 可以从已授权本地 `vercel link` 生成的 `.vercel/project.json` 获取。
令牌必须是真实账号下有部署权限的凭据；缺失时示例会失败，不会偷偷切换匿名部署。
版本变量是有意保留的安装前提，不能用未经验证的 `latest` 冒充可复现环境。

若启用了 Vercel Git 自动部署，必须明确关闭其自动发布路径，或配置同等生产门禁。
否则可能出现 Actions 仍在检查，Git 集成已把同一提交发布出去的旁路。

### 可复制的 GitHub Actions

维护者完成上述准备后，可在自己的仓库中将下面内容保存为 `.github/workflows/ci.yml`。
本文仅展示配置，不创建该文件。
如果默认生产分支不是 main，需要同时修改触发条件、job 条件和环境分支限制。

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      deploy:
        description: '质量检查通过后申请生产部署'
        type: boolean
        required: true
        default: false

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.event_name }}-${{ github.ref }}
  cancel-in-progress: false

jobs:
  quality:
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v5
        with:
          persist-credentials: false
      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          cache: npm
          cache-dependency-path: package-lock.json
      - name: Pin npm
        run: npm install --global npm@10.9.2
      - name: Install locked dependencies
        run: npm ci
      - name: Type check
        run: npx --no-install tsc --noEmit --incremental false
      - name: Lint
        run: npm run lint
      - name: Content smoke assertions
        shell: bash
        run: |
          node <<'NODE'
          const fs = require('node:fs');
          const path = require('node:path');
          const assert = require('node:assert/strict');
          const matter = require('gray-matter');
          let count = 0;
          for (const root of ['content/frontend-knowledge', 'content/ai-engineer']) {
            for (const category of fs.readdirSync(root).sort()) {
              const dir = path.join(root, category);
              for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
                const { data, content } = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
                for (const key of ['title', 'description', 'updatedAt', 'module']) {
                  assert.equal(typeof data[key], 'string', `${file}: ${key}`);
                  assert.ok(data[key].trim(), `${file}: empty ${key}`);
                }
                assert.match(data.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
                assert.ok(Number.isInteger(data.order));
                assert.ok(['outline', 'draft', 'done'].includes(data.status));
                assert.match(content, /^# /m);
                count += 1;
              }
            }
          }
          assert.ok(count > 0, 'No content checked');
          console.log(`Validated ${count} content files`);
          NODE
      - name: Production build
        run: npm run build

  production:
    needs: quality
    if: github.event_name == 'workflow_dispatch' && inputs.deploy && github.ref == 'refs/heads/main'
    runs-on: ubuntu-24.04
    timeout-minutes: 30
    environment: production
    concurrency:
      group: production-deployment
      cancel-in-progress: false
    env:
      VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      VERCEL_CLI_VERSION: ${{ vars.VERCEL_CLI_VERSION }}
    steps:
      - uses: actions/checkout@v5
        with:
          persist-credentials: false
      - uses: actions/setup-node@v6
        with:
          node-version-file: '.nvmrc'
          package-manager-cache: false
      - name: Validate deployment prerequisites
        shell: bash
        run: |
          test -n "$VERCEL_ORG_ID"
          test -n "$VERCEL_PROJECT_ID"
          test -n "$VERCEL_TOKEN"
          [[ "$VERCEL_CLI_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
      - name: Install npm and pinned CLI
        run: |
          npm install --global npm@10.9.2
          npm install --global "vercel@$VERCEL_CLI_VERSION"
      - name: Install project dependencies
        run: npm ci
      - name: Pull production settings
        run: vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
      - name: Build Vercel output
        run: vercel build --prod --token="$VERCEL_TOKEN"
      - name: Deploy the prebuilt output
        run: vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
```

当前 checkout v5 与 setup-node v6 的 action 自身使用 Node 24 runtime。
这和 `node-version-file` 为项目选择 Node 22 是两回事；自托管 runner 还要满足 action 的最低 runner 版本要求。
正式安全加固可把 action 的主版本标签替换成审核过的完整 commit SHA，不能编造 SHA。

每个 run 步骤默认失败即中止，`needs: quality` 也不会在 quality 失败后继续发布。
由于当前已知 lint 错误，原样运行会在 lint 阶段阻断；这是预期保护，不是模板应该掩盖的问题。

内容冒烟是真实断言，验证元数据和内容可读，但不是单元测试、组件测试或 E2E 的替代品。
后续增加测试框架时，应把存在的测试脚本加入门禁，不能用 `--if-present` 隐藏测试缺失。

### 构建前提不能遗漏

`npm ci` 需要 npm registry、平台原生依赖和正确的锁文件。
跨 macOS/Linux 时要关注 SWC、Tailwind 等平台二进制，不应把本机 node_modules 打包给 runner。

本仓库当前 `app/layout.tsx` 未使用 `next/font/google`，全局 CSS 也没有远程 Google Fonts 导入。
因此不能把“本站必定下载 Google 字体”写成既成事实。
但若后续引入 Google 字体优化，构建时需要访问字体样式与字体文件服务，受 DNS、代理、TLS 和出口策略影响。
离线构建应使用已获许可并纳入项目的本地字体与 `next/font/local`，不能捕获字体错误后假装 build 成功。

若静态生成读取远程 API 或 CMS，同样要提供网络和构建凭据，并区分构建期与运行期变量。
当前内容读取基于 `fs`，部署必须包含所需 `content/` 文件；实际平台文件追踪结果必须抽查。
不应在还没配置静态导出、处理动态路由与服务端功能前，把 `out/` 当作本站必然存在的产物。

示例的 quality 会做一次无生产 secret 的普通 Next 构建。
手工部署时会拉取生产环境后，**再做一次** Vercel 格式构建，这是明确的环境隔离成本。
`--prebuilt` 避免上传后再触发一次远程构建；它不意味着整个 workflow 从头到尾只编译一次。
不能拿 quality 的普通 `.next` 目录直接传给 `vercel deploy --prebuilt`。

### 发布验收与回滚

部署命令结束后记录唯一部署 URL、Git SHA、构建环境及审批记录。
验收首页、`/knowledge`、`/ai-engineer` 和一篇含中文路径的详情页，同时检查 CSS 与异步资源。
如果项目开启 Deployment Protection，自动探测需要相应授权或 bypass secret；普通匿名请求可能只能得到鉴权页。
不要把登录页的 200 状态误认为业务页面验收通过。

生产故障时优先回退到**已存在且已验证**的部署，而不是在压力下重新构建旧源码。
下面是维护者获批后的手动命令，不会由本文自动执行：

```bash
vercel rollback "$PREVIOUS_DEPLOYMENT_URL" --token="$VERCEL_TOKEN"
```

前提是已关联正确 Vercel 项目、令牌有相应权限，且目标部署符合当前套餐的回滚范围。
Hobby 套餐通常只允许回到上一生产部署，不能假设任意历史 URL 都可回滚。
回滚不会撤销数据库写入、外部副作用或已经泄露的密钥，存在后端时还需独立恢复策略。

未采用 Vercel 时，也可以在受控 Node 主机上执行生产构建后以 `npm run start` 运行。
那还需要进程守护、TLS 反向代理、资源保留、发布目录切换与权限配置，不是把静态文件上传完就结束。
本文选择 Vercel CLI 作为完整部署路径，不假装同时给出了可直接上线的自托管运维方案。

## 五、误区

- **Next build 自动替代 lint。** Next 16 已移除旧 lint 集成，独立 ESLint 步骤不可省略。
- **有缓存就不用 npm ci。** 缓存加速下载，不保证安装目录与锁文件一致。
- **绿灯代表所有测试通过。** 本文只有类型、lint、内容冒烟和构建，不包含尚不存在的 E2E。
- **让部署读取 PR secrets 更方便。** 不可信代码可能泄露令牌，部署必须在可信分支和审批后执行。
- **能构建就能部署到 Pages。** 当前项目没有配置静态导出，服务端能力需要兼容的运行平台。
- **回滚等于撤销所有影响。** 它主要切换服务版本，外部状态必须单独处理。

## 六、总结

CI/CD 的价值在于可复现环境、真实失败门禁、最小部署权限及可验证的恢复路径。
对本站而言，先修复现有 lint 阻断，再由维护者配置凭据和审批，才有资格启用生产发布。

延伸阅读：

- [Webpack原理](/knowledge/05-工程化/02-Webpack原理)：构建工具的职责边界。
- [代码分割](/knowledge/05-工程化/06-代码分割)：旧版本 chunk 保留。
- [前端监控](/knowledge/05-工程化/07-前端监控)：发布标识与 source map。

官方资料（2026-10-02 核对）：

- [Next.js 16 升级说明](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [actions/setup-node v6](https://github.com/actions/setup-node/tree/v6)
- [actions/checkout v5](https://github.com/actions/checkout/tree/v5)
- [Vercel 与 GitHub Actions](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Vercel CLI rollback](https://vercel.com/docs/cli/rollback)
- [Next.js 字体组件](https://nextjs.org/docs/app/api-reference/components/font)
- [Next.js 自托管](https://nextjs.org/docs/app/guides/self-hosting)

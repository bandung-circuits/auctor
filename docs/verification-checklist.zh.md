# dsh-auctor 验证清单

分层对齐 pictor：离线越快越靠前，在线越靠后越全面。全部冒烟层封闭式（临时 `DSH_HOME`/`AUCTOR_HOME`），不碰真实 `~/.dsh`。

## L1 · 纯函数（verify.mjs，毫秒级）

- [x] `firstLine` 取首个非空行、超长截断加省略号
- [x] `sanitizeSlug` 空名回落、压非字母数字为中杠、保留中文
- [x] `milestonesOf` 空项目全 waiting；summary 之后 research done + expert gated；accept 标记后 article done

## L2 · 宿主集成（verify.mjs，mock ctx，秒级）

- [x] `config.get` 返回 dataRoot 且 `.dsh/mcp.servers.yml` 已种子
- [x] `project.create` 缺新闻线索被拒；全量脚手架（agents/references/kritik/pomasa.json 快照、input/、run.json 骨架、materials 索引）
- [x] index.json 登记项目；宿主不建会话（无 sessionId）
- [x] prompt 二分：无会话附续做指令；会话存活直传原消息；会话闲置重新附续做指令
- [x] pulse 跟随 agents 注册表拨动
- [x] 里程碑全链路：summary → expert gated → 素材就位 active → insights/deep done → points gated → outline gated → article gated → accept 后 done
- [x] submitExperts 落盘 raw + skip 标记
- [x] saveArtifact 写回；路径穿越/白名单外拒绝；project.file 防穿越
- [x] project.get 全量视图；project.list 视图
- [x] rename 只动 index；delete 删目录 + 索引

## L3 · transport 冒烟（`scripts/transport-smoke.sh`，真 dsh web）

- [x] `/auctor` 通道在真实 HTTP 上注册并服务
- [x] 错误腿：空 project.create 返回 `{ok:false,error}`
- [x] 成功腿：project.create(新闻线索) 返回 id+prompt；config.get 返回 dataRoot+mcpSeeded

## L4 · 浏览器 e2e（`npm run test:e2e`，真 dsh web + fixture 项目）

- [x] footer 按钮「Auctor」打开工作台
- [x] 左栏项目列表呈现 fixture 项目
- [x] 六段阶段条；评论要点门为「待你决定」
- [x] 要点正文渲染；编辑 + 保存回写成功提示
- [x] 深度研究分组 tab 可展开看摘录（索引相对路径拼接正确）

## L5 · 安装冒烟（`scripts/install-smoke.sh`，README 路径）

- [x] `npm pack` tarball 必带 lib/、agents/、references/（含 kritik）、pomasa.json、cordis.patch.yml
- [x] `dsh plugin add`（本地 tgz 或 `AUCTOR_INSTALL_SPEC=dsh-auctor` npm 源）→ 真实 dsh web 启动
- [x] 已装包文件齐全、profile 清单列出 dsh-auctor、`/plugins/dsh-auctor/client.js` 可访问、RPC 两腿

## 手工核对（发布前）

- [ ] 在真实 DSH Desktop 上建一个项目，Group 00 一路跑完出摘要（联网：serper/crawl4ai 凭证已配）
- [ ] 提交专家素材 → 深度研究自动推进到要点门
- [ ] 要点门编辑保存 → 确认 → 提纲门 → 确认 → 成稿 → 定稿收口
- [ ] dsh 重启后回到项目，界面从文件事实恢复，讨论面板一句话续跑
- [ ] 双语切换；删除二次确认；改名只动标题
// L4a 确定性 e2e：真实 dsh web + fixture 项目（停在评论要点门）。
// 只断言界面展示与编辑保存，不触发真实会话驱动（保持确定性，无模型依赖）。
// dsh web 的空态引导层（_mask/_root）会压住点击命中测试：所有交互统一用
// 程序化 click（$eval），绕开几何拦截；断言仍走常规 locator。
import { test, expect } from '@playwright/test'

const click = (page, selector) => page.$eval(selector, (el) => el.click())

test('工作台：fixture 项目按要点门状态呈现，可编辑并保存要点', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')

  // 1) 坞在 footer 直接排图标，点 Auctor 图标进入工作台（无中间面板）
  await page.waitForSelector('[data-dock-app="dsh-auctor"]', { timeout: 60_000 })
  await click(page, '[data-dock-app="dsh-auctor"]')
  await page.waitForSelector('.au-workbench', { timeout: 30_000 })

  // 2) 左栏出现 fixture 项目
  await page.waitForSelector('.au-nav-item', { timeout: 30_000 })
  const titles = await page.$$eval('.au-nav-item-title', (els) => els.map((e) => e.textContent))
  expect(titles.some((t) => t && t.includes('Fidel centennial'))).toBe(true)

  // 3) 打开项目，六段阶段条呈现，评论要点为“待你决定”
  await click(page, '.au-nav-item')
  await page.waitForSelector('.au-stages', { timeout: 30_000 })
  const stageCount = await page.$$('.au-stage')
  expect(stageCount.length).toBe(7)
  const stageTexts = await page.$$eval('.au-stage', (els) => els.map((e) => e.textContent))
  const pointsSeg = stageTexts.findIndex((s) => s && s.includes('评论要点'))
  expect(pointsSeg).toBeGreaterThan(-1)
  // fixture 停在评论要点门 → 状态由圆点颜色表达（同 pictor）：gate 蓝点类 au-st-gate
  const pointsCls = await page.$eval('.au-stage:has-text("评论要点")', (el) => el.className)
  expect(pointsCls).toContain('au-st-gate')

  // 4) 默认落在当前阶段（评论要点门），要点以卡片呈现，点卡片弹 modal 看全文
  await page.waitForSelector('.au-artifact-title', { timeout: 30_000 })
  const title = await page.textContent('.au-artifact-title')
  expect(title.trim()).toBe('评论要点')
  await expect(page.locator('.au-section-name')).toContainText('Centennial as anticolonial symbol', { timeout: 15_000 })
  await click(page, '.au-section-card')
  await expect(page.locator('.au-modal')).toContainText('mobilizes anti-imperialist memory', { timeout: 10_000 })
  await click(page, '.au-modal-box .au-btn.ghost')

  // 5) 编辑并保存，写回成功提示出现
  await click(page, 'button:has-text("编辑")')
  await page.waitForSelector('.au-artifact-textarea', { timeout: 10_000 })
  await page.fill('.au-artifact-textarea', '# Commentary Points (edited)\n\nEdited content.')
  await click(page, 'button:has-text("保存编辑")')
  await expect(page.locator('.au-flash')).toContainText('已保存', { timeout: 10_000 })

  // 6) 深度研究：研究问题 Category 折叠 + 深研分组折叠 / 问题卡片 → modal
  await click(page, '.au-stage:has-text("深度研究")')
  await page.waitForSelector('.au-fold', { timeout: 10_000 })
  const foldTexts = await page.$$eval('.au-fold-title', (els) => els.map((e) => e.textContent))
  expect(foldTexts.some((t) => t && t.includes('Category A'))).toBe(true)
  expect(foldTexts.some((t) => t && (t.includes('Q1') || t.includes('Diplomacy')))).toBe(true)
  // 研究问题：展开 Category B → 问题卡片
  await click(page, '.au-fold-head:has-text("Category B")')
  await page.waitForSelector('.au-section-card', { timeout: 10_000 })
  await click(page, '.au-section-card')
  await expect(page.locator('.au-modal')).toContainText('How do Latin American states respond', { timeout: 10_000 })
  await click(page, '.au-modal-box .au-btn.ghost')
  await page.waitForSelector('.au-modal', { state: 'detached', timeout: 10_000 })
  // 收起 Category B，展开深研分组 Diplomacy → 问题卡片 → modal
  await click(page, '.au-fold-head:has-text("Category B")')
  await click(page, '.au-fold-head:has-text("Diplomacy")')
  await page.waitForSelector('.au-section-card:has-text("Regional statements")', { timeout: 10_000 })
  await click(page, '.au-section-card:has-text("Regional statements")')
  await expect(page.locator('.au-modal')).toContainText('Regional statements', { timeout: 10_000 })
  await click(page, '.au-modal-box .au-btn.ghost')
})
test('快速研究：角度卡片 → 点击弹 modal 展示完整摘录，可关闭', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await click(page, '[data-dock-app="dsh-auctor"]')
  await page.waitForSelector('.au-workbench', { timeout: 30_000 })
  await page.waitForSelector('.au-nav-item', { timeout: 30_000 })
  await click(page, '.au-nav-item')
  await page.waitForSelector('.au-stages', { timeout: 30_000 })
  await click(page, '.au-stage:has-text("快速研究")')
  await page.waitForSelector('.au-angle-card', { timeout: 20_000 })
  const cards = await page.$$('.au-angle-card')
  expect(cards.length).toBeGreaterThan(0)
  // 初始摘要为整页卡片，点开 modal 内含目录
  await page.waitForSelector('.au-summary-card', { timeout: 15_000 })
  await click(page, '.au-summary-card')
  await expect(page.locator('.au-modal')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('.au-modal .au-toc-item').first()).toBeVisible({ timeout: 10_000 })
  // markdown-it 渲染：表格 + 列表项加粗
  await expect(page.locator('.au-modal table')).toContainText('Attendance', { timeout: 10_000 })
  expect(await page.$$('.au-modal li strong')).not.toHaveLength(0)
  await click(page, '.au-modal-box .au-btn.ghost')
  await expect(page.locator('.au-modal')).toHaveCount(0, { timeout: 10_000 })
  await click(page, '.au-angle-card')
  await expect(page.locator('.au-modal')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('.au-modal')).toContainText('Event Overview')
  await expect(page.locator('.au-modal')).toContainText('Fidel centennial')
  await click(page, '.au-modal-box .au-btn.ghost')
  await expect(page.locator('.au-modal')).toHaveCount(0, { timeout: 10_000 })
})


test('已确认 Brief 的项目：确认步按钮变为“查看研究进度”，点击进入快速研究页', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await click(page, '[data-dock-app="dsh-auctor"]')
  await page.waitForSelector('.au-workbench', { timeout: 30_000 })
  // brief fixture 项目会被 DetailPane 的 auto-rename 改成 brief 建议名（pictor 同款），
  // 用不变的子串 "brief" 定位，规避 rename 时序竞态
  await page.waitForSelector('.au-nav-item:has-text("brief")', { timeout: 30_000 })
  await click(page, '.au-nav-item:has-text("brief")')
  await page.waitForSelector('.au-stages', { timeout: 30_000 })
  // 研究进行中 → 默认落在快速研究步
  await expect(page.locator('.au-stage.on')).toContainText('快速研究', { timeout: 15_000 })
  // 回看“确认选题”步：brief 已确认 → 按钮是“查看研究进度”，不再是“确认并启动”（防重复触发 Group 00）
  await click(page, '.au-stage:has-text("确认选题")')
  await expect(page.locator('button:has-text("查看研究进度")')).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('button:has-text("确认并启动")')).toHaveCount(0)
  // 点击按钮即进入下一步（快速研究）
  await click(page, 'button:has-text("查看研究进度")')
  await expect(page.locator('.au-stage.on')).toContainText('快速研究', { timeout: 15_000 })
})

test('新建：表单提交 → 落到项目详情·确认选题(Brief)步（运行态可见）', async ({ page }) => {
  test.setTimeout(120_000)
  const leadText = '缅甸军政府就大选日期发表声明'
  await page.goto('/')
  await click(page, '[data-dock-app="dsh-auctor"]')
  await page.waitForSelector('.au-workbench', { timeout: 30_000 })
  await click(page, '.au-btn-new')
  const leadBox = page.locator('.au-field').nth(0).locator('textarea')
  await leadBox.waitFor({ timeout: 20_000 })
  await leadBox.evaluate((el, text) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
    setter.call(el, text)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, leadText)
  await expect(page.locator('.au-field').nth(0).locator('textarea')).toHaveValue(leadText)
  const createBtn = page.locator('button:has-text("创建并开始")')
  await expect(createBtn).toBeEnabled({ timeout: 10_000 })
  await click(page, 'button:has-text("创建并开始")')
  // 落到项目详情·确认选题步：左侧出现新项目，阶段条激活格=确认选题
  await expect(page.locator('.au-nav-item', { hasText: leadText }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('.au-stages')).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.au-stage.on')).toContainText('确认选题', { timeout: 15_000 })
  // Brief 未产出（无模型）→ 页内显示工作态
  await expect(page.locator('.au-pane-hint').first()).toContainText('正在', { timeout: 15_000 })
})

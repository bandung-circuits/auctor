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
  expect(stageTexts[pointsSeg]).toContain('待你决定')

  // 4) 默认落在当前阶段（评论要点门），要点正文渲染
  await page.waitForSelector('.au-artifact-title', { timeout: 30_000 })
  const title = await page.textContent('.au-artifact-title')
  expect(title.trim()).toBe('评论要点')
  await expect(page.locator('.au-md')).toContainText('Centennial as anticolonial symbol')

  // 5) 编辑并保存，写回成功提示出现
  await click(page, 'button:has-text("编辑")')
  await page.waitForSelector('.au-artifact-textarea', { timeout: 10_000 })
  await page.fill('.au-artifact-textarea', '# Commentary Points (edited)\n\nEdited content.')
  await click(page, 'button:has-text("保存编辑")')
  await expect(page.locator('.au-flash')).toContainText('已保存', { timeout: 10_000 })

  // 6) 深度研究分组可折叠查看（downstream structure sanity）
  await click(page, '.au-stage:has-text("深度研究")')
  await page.waitForSelector('.au-tabs', { timeout: 10_000 })
  const tabs = await page.$$eval('.au-tab', (els) => els.map((e) => e.textContent))
  expect(tabs.some((t) => t && (t.includes('Q1') || t.includes('Diplomacy')))).toBe(true)
  await click(page, '.au-tab')
  await expect(page.locator('.au-tab-body')).toContainText('Regional statements', { timeout: 10_000 })
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
  // 摘要右侧悬浮目录
  const tocItems = await page.$$('.au-toc-item')
  expect(tocItems.length).toBeGreaterThan(1)
  await click(page, '.au-angle-card')
  await expect(page.locator('.au-modal')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('.au-modal')).toContainText('Event Overview')
  await expect(page.locator('.au-modal')).toContainText('Fidel centennial')
  await click(page, '.au-modal-box .au-btn.ghost')
  await expect(page.locator('.au-modal')).toHaveCount(0, { timeout: 10_000 })
})


test('新建：表单 → 确认初始阶段（标题/计划/注记）→ 生成项目', async ({ page }) => {
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
  const nextBtn = page.locator('button:has-text("下一步：确认选题")')
  await expect(nextBtn).toBeEnabled({ timeout: 10_000 })
  await click(page, 'button:has-text("下一步：确认选题")')
  // 初始确认页：计划汇报 + 标题自动带出
  await expect(page.locator('.au-plan')).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('.au-plan')).toContainText('接下来的流程')
  const titleVal = await page.locator('.au-field input').first().inputValue()
  expect(titleVal).toBe(leadText)
  // 确认并启动 → 项目出现在列表
  await click(page, 'button:has-text("确认并启动")')
  await expect(page.locator('.au-nav-item', { hasText: leadText }).first()).toBeVisible({ timeout: 30_000 })
})

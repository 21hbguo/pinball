# 弹珠机 Pinball

实体弹珠机规则复刻 —— 每局永远只有 **一颗**实体弹珠：穿过钉阵，
落入底部 12 个通道之一结算。

## 玩法规则

1. 按【开始】一次 → 倍率灯 + 12 通道灯随机游动。
2. 再按【开始】→ 锁定本局：基础倍率（2X/4X/6X/8X/10X）+ 亮灯通道集合。
3. 【投注 ±】设定本局投入的弹珠额度，然后**按住【发射】蓄力**，
   松手发射——快速点按则按预设中等力度直接发射。
4. 弹珠沿右侧发射道上冲，经顶部弧轨进入钉板区。**力度不足会掉回
   弹盘，可免费重发**（与真机一致）。
5. 球落入 12 通道之一：
   - 亮灯通道 → 派彩 = `投注 × 倍率`
   - 未亮通道 → 派彩 = 0
6. 余额存于 `localStorage`；【+10 弹珠】加额度，【新局】重开。

操作：屏幕按钮；键盘 `空格/回车` = 开始 / 按住蓄力，`↑/↓` = 投注，
`I` = +10 球，`R` = 新局。

## Web 版

`web/` 静态站点，无构建、无依赖：

```bash
./start.sh          # http://localhost:8000（绑定 0.0.0.0，局域网可玩）
./start.sh 9000     # 自定义端口
```

## 目录结构

```
web/            Web 版（Canvas，原生 JS，ES modules）
  js/config.js    台面几何与调校常量
  js/state.js     共享状态 + 钱包持久化
  js/audio.js     WebAudio 音效
  js/game.js      回合/会话规则
  js/physics.js   弹珠物理与碰撞
  js/render.js    Canvas 绘制
  js/input.js     指针/键盘控制
  js/main.js      装配 + 主循环
art/mvp/        MVP 美术包 v1（SVG、OBJ）
art/mvp-v2/     美术方向 v2（暖黄/奶白、红色 LED）
docs/           （在 feat 分支上）设计文档
```

注意：`art/mvp-v2/package/pinball_mvp_art_pack_v2.zip` 目前损坏
（无中央目录），需重新上传。

## License

TBD

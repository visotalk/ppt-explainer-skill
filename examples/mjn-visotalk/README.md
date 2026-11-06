# Hold 背后的距离

标准 VisoTalk 作品，使用 spec 0.8.0，并以 CLI 0.8.6 验证。

- `doc.tsx` 定义讲稿、章节、画面和词语锚定动画。
- `visuals.tsx` 通过 VisoTalk `useProp` 绘制数据图形，全部运动由文档中的 `Tween` 驱动。
- `voice.mjs` 使用 VisoTalk 官方自定义 provider 接口，复用已确认的云希音频和服务返回的词边界。词内汉字时间由该词时长均分，不能视作逐字实测对齐。
- `library/source.pdf` 是事实来源（未提交，下载地址见仓库 evals/materials.json）。估值百分比暂按同一币种口径计算，原稿币种标注存在不确定性。
- 视觉方法参考 MotionHub Drafting Table 的测量、引线与绘图顺序，以及 VisoTalk population 示例的连续数据画面。组件为本作品编写。

先运行 `python -m pip install edge-tts==7.3.1` 和 `python generate_voice.py` 生成本地配音，再运行 `./produce.ps1` 完成 validate、prepare、qa 和 build。生成配音会将讲稿发送至微软在线语音服务。

```powershell
npx --yes visotalk@latest play doc.tsx --port 3096
```

编辑讲稿会改变配音文本。当前 provider 只接受 library/narration.json 中已确认的片段，以避免静默复用旧配音；新讲稿应先生成并确认音频，或在 Doc 上配置其他 VisoTalk provider。

需要 MP4 时使用 `npx --yes visotalk@latest render doc.tsx`。当前交付为 `dist/player.html` 及其配套资产，全部由 VisoTalk 构建。

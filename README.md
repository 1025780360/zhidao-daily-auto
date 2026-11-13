# 知到每日任务（智慧树自动学习 + 问答）

Windows 上的自动化小工具：每天自动打开智慧树（知到），把两门课各看 25 分钟，并在问答区完成 1 条提问 + 3 条回答；附带一个 C# WinForms 面板用于启动、停止和查看进度。

## 功能

- 每日固定时长刷课，默认每门 25 分钟，可在 `config.json` 修改
- 每门课的视频策略单独配置：
  - `random`：只随机挑一章开始看，不判断完成度（适合已 100% 的课）
  - `unfinishedFirst`：优先未看完的章节，全部看完后随机挑一章
- 章节播完后自动换章；已完成章节停在结尾时会从头重播
- 视频弹题自动作答：随机选一个选项再点关闭（弹题不计成绩）
- 问答区：自动发布 1 条提问 + 3 条回答，走页面上的真实点击；当天已完成的记录在 `state.json`，不重复发布
- 面板：两门课的进度条、提问/回答状态、最近日志，以及「立即运行 / 停止任务 / 打开日志文件夹」
- 停止任务：面板写 `stop.flag`，脚本在下一个循环暂停视频、保存精确进度并退出；10 秒未退出才强制结束进程

## 目录

```
daily.mjs          主脚本（Node，运行在 ego-browser 的 nodejs 环境）
config.json        学习时长配置
panel/面板.cs      Windows 面板源码（WinForms）
panel/app.ico      面板图标
```

运行时会在脚本目录下生成：

```
state.json      每天的提问/回答记录与学习秒数
status.json     面板和脚本之间的状态文件（面板每秒读取）
logs/           每日日志
```

这些运行数据已在 `.gitignore` 中排除。

## 使用前提

- Windows 10/11，已安装 Node.js（脚本由 ego-browser 内置的 Node 运行）
- 已安装并登录 ego-browser，浏览器里保持智慧树账号登录
- 两门课的 `courseId`、`recruitId`、`secret` 需要按自己的课程填写

`secret` 是学习页地址 `https://studyvideoh5.zhihuishu.com/stuStudy?recruitAndCourseId=...` 里的参数值。仓库中已替换为占位符 `YOUR_MILITARY_SECRET` / `YOUR_SECURITY_SECRET`，使用前请从浏览器地址栏复制真实值填入 `daily.mjs` 顶部的 `COURSES`。

## 运行

```
"C:\Users\<用户名>\.local\share\ego\active_version_dir\ego-browser.exe" nodejs -e "await import('file:///D:/zhidao-daily/daily.mjs')"
```

路径建议不要带中文和空格，file URL 需要编码。也可以写成 `run.bat`，再用 Windows 计划任务每天定时触发。

## 面板

面板是自包含的单一 exe，源码在 `panel/面板.cs`，编译前先把文件里的 `Root`（脚本目录）和 `RunBat`（启动脚本路径）改成自己的路径，然后：

```
%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe -target:winexe -win32icon:app.ico ^
  -r:System.Web.Extensions.dll 面板.cs
```

面板通过 `status.json` 显示进度；超过 180 秒未更新视为未运行。

## 说明

本项目仅用于个人学习自动化实践，请遵守智慧树平台的使用规则，使用风险自负。

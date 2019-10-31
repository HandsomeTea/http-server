# attach debug
## 前提
- 使用`npm run debug`或`npm run debug-brk`启动服务
## 使用
- 随时可以触发vscode的debug按钮
- 开始debug之前打的断点还在
- 调试专用的控制台不可以使用
- 直接停止服务debug模式自动退出
## 停止debug
- 直接点击停止debug的按钮
- 服务依然以debug的模式启动，随时接受attach debug

# launch debug
## 前提
- 服务不要启动
## 使用
- 直接触发vscode的debug按钮启动服务
- 项目启动之后再打断点，之前打的断点被清空
- 调试专用的控制台可以使用
- 无法单纯的停止服务，只能通过停止debug来停止服务
## 停止debug
- 直接点击停止debug的按钮
- 服务也随之停止运行

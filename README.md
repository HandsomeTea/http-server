[TOC]



# http(s)-server

## 概述
- 个人瞎搞



## res

- 封装了http的返回格式
  - `success`
  - `failure`
  - `notFound`
  - `serverError`
  - `noPermission`

## 数据库

- 封装了mongodb
- 预留了多租户的支持



## redis

- 封装了redis



## Dockerfile





## log

### 日志类型
- `log`：日常开发打日志使用
- `trace`：服务器间的跟踪日志
- `audit`：操作日志，存储在项目根目录的`.log`文件中
- `system`：系统日志使用



### 日志级别控制

- 从process.env中获取





## jwt鉴权





## pm2

- 单例模式：`npm run pm2`
- 集群模式：`npm run cluster`



## api文档

- `npm run doc`，访问3000端口



## process.env控制

- yaml文件热更新



## debug

- vscode调试文件



## 依赖包升级

- `npm run upgrade`



## eslint语法检查

- `npm run fix`



## 性能测试

- 压力测试
- 异常测试
- 测试覆盖率

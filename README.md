[TOC]



# personal-server

## 概述
- 个人瞎搞



## http result

- 封装了http的返回格式
  - `success`
  - `failure`
  - `notFound`
  - `serverError`
  - `noPermission`

## 数据库





## Dockerfile





## log

### 日志类型
- `log`：日常开发打日志使用，相当于`console.log()`
- `trace`：服务器间的跟踪日志
- `audit`：操作日志，存储在项目根目录的`.log`文件中



### 日志级别控制

- 从process.env中获取





## jwt鉴权





## pm2

- 单例模式：`npm run pm2`
- 集群模式：`npm run cluster`

## api文档

- `npm run doc`，访问3001端口



## process.env控制





## debug



## 依赖包升级





## eslint语法检查

- `npm run fix`





## 性能测试

- 压力测试
- 异常测试
- 测试覆盖率





## redis

#指定使用最新版本的node基础镜像
FROM node:latest

#在容器内执行命令
RUN mkdir -p /usr/local/develop

#将宿主机的某一个目录设置为镜像的数据持久化目录
VOLUME /usr/local/dockerData

#设置镜像内的工作目录
WORKDIR /usr/local/develop

#设置环境变量
ENV ADDRESS_BOOK_ADDR=surpass_addressbook
ENV SURPASS_CORE_ADDR=surpass_surpasscore

#将宿主机某目录的内容复制到镜像目录中
COPY . /usr/local/develop

#安装nodejs应用的依赖(WORKDIR那一步已经将进入/usr/local/develop目录)
RUN npm install

#对外开放容器的8010端口(因为项目中的服务启动端口为8010)
EXPOSE 8010

#容器启动后执行的命令
# ENTRYPOINT []

#拼接在上一项(ENTRYPOINT)后面
CMD ['npm','run','start']

#开始创建docker应用的镜像，-t参数，将镜像命名为test
#docker build -t test ./
#使用test镜像运行一个命名为experss-app的容器
#-d指定容器以后台的方式运行
#-p参数将宿主机的3001端口映射到了容器的8010端口(上面EXPOSE项开放的端口)
#docker run -d --name experss-app -p 8010:3001 test

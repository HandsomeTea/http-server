#指定使用最新版本的node基础镜像
FROM node:20.11.1

#在容器内执行命令
RUN mkdir -p /usr/local/develop

#将宿主机的某一个目录设置为镜像的数据持久化目录
VOLUME /usr/local/dockerData

#设置镜像内的工作目录
WORKDIR /usr/local/develop

#设置环境变量
ENV ADDRESS_BOOK_ADDR=my_addressbook
ENV CORE_ADDR=my_core

#将宿主机某目录的内容复制到镜像目录中
COPY ./build /usr/local/develop
COPY package.json /usr/local/develop/package.json
COPY package-lock.json /usr/local/develop/package-lock.json

#安装nodejs应用的依赖(WORKDIR那一步已经将进入/usr/local/develop目录)
RUN npm install

# RUN cnpm install -g clinic
# RUN apt-get update && apt-get install net-tools

#对外开放容器的8010端口(因为项目中的服务启动端口为8010)
EXPOSE 8010

#容器启动后执行的命令
# ENTRYPOINT []

#拼接在上一项(ENTRYPOINT)后面
# CMD ["clinic", "flame", "--open=false", "--", "node", "--max-old-space-size=2560", "--max_semi_space_size=512", "index.js"]
# CMD ["clinic", "heapprofiler", "--open=false", "--", "node", "--max-old-space-size=2560", "--max_semi_space_size=512", "index.js"]
# CMD ["clinic", "doctor", "--open=false", "--", "node", "--max-old-space-size=2560", "--max_semi_space_size=512", "index.js"]
CMD ["node", "--max-old-space-size=900", "--max_semi_space_size=64", "index.js"]

#开始创建docker应用的镜像，-t参数，将镜像命名为test
#docker build -t test ./
#使用test镜像运行一个命名为experss-app的容器
#-d指定容器以后台的方式运行
#-p参数将宿主机的3001端口映射到了容器的8010端口(上面EXPOSE项开放的端口)
#docker run -d --name experss-app -p 8010:3001 test

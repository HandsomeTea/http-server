import fs from 'fs';
import { Readable, Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ListBucketsCommand, ListObjectsCommand, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import aws from '@/tools/aws';
import { getENV, log } from '@/configs';

export default new class CephOSSService {
    private bucket = 'my-test-bucket';

    constructor() {
        // my-test-bucket
        // this.uploadFile({ localAbsolutePath: '/home/SENSETIME/liuhaifeng/obb_carplate_quant.tar' }, '/test/test.tar').then((res) => {
        // this.downloadFile({ address: 'http://10.155.172.238:30081/my-test-bucket//test/test.tar' }, './aaa.tar').then((res) => {
        //     // http://10.155.172.238:30081/my-test-bucket//test/test.tar
        //     // /test/dic.json
        //     // this.listObjects({ pathInBucket: '/test/dic.json' }).then((res) => {
        //     console.log(123, res);
        // }).catch((err) => {
        //     console.log(err);
        // });
    }

    /** 列出所有bucket */
    async listBuckets() {
        const command = new ListBucketsCommand({});

        return await aws.server?.send(command);
    }

    /** 列出当前bucket所有object */
    async listObjects() {
        const command = new ListObjectsCommand({ Bucket: this.bucket });

        return await aws.server?.send(command);
    }

    /**根据pathInBucket生成文件在oss的地址 */
    private getAddress(pathInBucket: string) {
        return `${new URL(getENV('AWS_URL')).origin}/${this.bucket}/${pathInBucket}`;
    }

    private getPathInBucket(address: string) {
        return address.replace(`${new URL(getENV('AWS_URL')).origin}/${this.bucket}/`, '');
    }

    /**
     * 上传文件
     * @param file 要上传的文件的内容/Buffer(fs.readFileSync())/本地绝对路径
     * @param pathInBucket 上传到bucket中的路径，例如：test/test.txt，则上传到bucket的test文件夹下，文件名为test.txt
     * @param expireAt 过期时间
     * @returns
     */
    async uploadFile(file: { localAbsolutePath?: string, content?: string | Buffer }, pathInBucket: string, expireAt?: Date) {
        const { content, localAbsolutePath } = file;

        if (content) {
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Expires: expireAt,
                Body: content,
                Key: pathInBucket
            });

            await aws.server?.send(command);
            return { address: this.getAddress(pathInBucket), pathInBucket };
        } else if (localAbsolutePath) {
            const fileStream = fs.createReadStream(localAbsolutePath);
            const parallelUploads3 = new Upload({
                client: aws.server as S3Client,
                params: {
                    Bucket: this.bucket,
                    Key: pathInBucket,
                    Body: fileStream,
                    ContentType: "application/octet-stream",
                },
                queueSize: 4, // 并发上传的分片数量
                partSize: 5 * 1024 * 1024, // 每个分片的大小（默认 5MB，Ceph 通常也支持这个最小值）
                leavePartsOnError: false // 上传失败后是否保留已上传的分片
            });

            // // 监听进度
            // parallelUploads3.on('httpUploadProgress', progress => {
            //     if (!progress) {
            //         return;
            //     }
            //     const percentage = Math.round(((progress.loaded || 0) / (progress.total || 1)) * 100);
            //     console.log(`上传进度: ${percentage}%`);
            // });

            try {
                const { Location, Key } = await parallelUploads3.done();

                return { address: Location, pathInBucket: Key };
            } catch (e) {
                log('aws-upload').error(e);
                throw new Exception(`upload file to aws oss failed: ${String(e)}`);
            }
        }
        return null;
    }

    private async downloadObject(pathInBucket: string, toLocalFile?: string) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: pathInBucket,
        });
        const response = await aws.server?.send(command);
        const stream = await response?.Body?.transformToWebStream();

        if (!stream) {
            return;
        }
        if (!toLocalFile) {
            return stream;
        }

        // 下载进度监控
        let downloadedSize = 0;
        const totalSize = response?.ContentLength || 1;
        const progressTracker = new Transform({
            transform(chunk, _encoding, callback) {
                downloadedSize += chunk.length;
                const percentage = ((downloadedSize / totalSize) * 100).toFixed(2);

                // 在控制台打印进度 (可以使用 \r 实现原地更新)
                process.stdout.write(`\r下载进度: ${percentage}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)`);

                // 将数据传递给下一个流（文件写入流）
                callback(null, chunk);
            }
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const nodeReadable = Readable.fromWeb(stream);
        const fileStream = fs.createWriteStream(toLocalFile, { highWaterMark: 128 * 1024 });

        return await pipeline(nodeReadable, progressTracker, fileStream);
    }

    /**
     * 文件下载
     * @param option 下载文件支持oss文件地址和bucket中的文件路径，pathInBucket必须和上传时的一致
     * @param toLocalFile 是否写入本地某个文件，如果为空则返回一个流，如果传入文件地址则写入该文件
     * @returns
     */
    async downloadFile(option: { address?: string, pathInBucket?: string }, toLocalFile?: string) {
        const { address, pathInBucket } = option;
        let key = '';

        if (address) {
            key = this.getPathInBucket(address);
        }
        if (pathInBucket) {
            key = pathInBucket;
        }
        if (!key) {
            return;
        }
        return await this.downloadObject(key, toLocalFile);
    }

    async getFileInfo(option: { address?: string, pathInBucket?: string }) {
        const { address, pathInBucket } = option;
        let key = '';

        if (address) {
            key = this.getPathInBucket(address);
        }
        if (pathInBucket) {
            key = pathInBucket;
        }
        if (!key) {
            return;
        }
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        const { LastModified, ContentLength } = await aws.server?.send(command) || {};

        return {
            LastModified,
            ContentLength
        };
    }

    async deleteFile(option: { address?: string, pathInBucket?: string }) {
        const { address, pathInBucket } = option;
        let key = '';

        if (address) {
            key = this.getPathInBucket(address);
        }
        if (pathInBucket) {
            key = pathInBucket;
        }
        if (!key) {
            return;
        }
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key
        });

        await aws.server?.send(command);
    }

    /**
     * 生成临时文件上传链接
     * @param fileName 要上传的文件的名字
     * @param suffix 文件后缀
     * @returns
     */
    async getTemporaryUploadUrl(fileName: string, suffix: string) {
        const expiry = 15; // 单位秒
        const time = new Date();

        if (!suffix.startsWith('.')) {
            suffix = `.${suffix}`;
        }
        // {fileName}-20251011131445-xxxxxxxxxx.{suffix}
        const file = `${fileName.substring(0, fileName.length - suffix.length)}-${[time.getFullYear(), time.getMonth() + 1, time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds()].map(a => {
            return a < 10 ? '0' + a : a;
        }).join('')}-${Math.random().toString(36).substring(2)}${suffix}`;
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: file,
            // 如果需要限制上传的文件类型，可以在这里设置
            // ContentType: 'image/jpeg
        });

        try {
            const url = await getSignedUrl(aws.server as S3Client, command, {
                expiresIn: expiry
            });

            return {
                url,
                fileName: file,
                method: 'put'
            }
        } catch (e) {
            log('aws-temporary-upload').error(e);
            throw new Exception(`create temporary upload url from aws failed: ${String(e)}`);
        }
    }
};

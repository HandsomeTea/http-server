import path from 'path';
import { BucketItem, BucketItemStat, Client } from 'minio'
import { getENV } from '@/configs';

/**
 * 无法上传文件夹，只能上传文件
 */

type Bucket = 'test';
interface BucketAuth {
	upload?: boolean
	delete?: boolean
	list?: boolean
	get?: boolean
}
type BucketPolicyAction =
	// Object
	's3:AbortMultipartUpload' |
	's3:DeleteObject' |
	's3:GetObject' |
	's3:ListMultipartUploadParts' |
	's3:PutObject' |
	// Bucket
	's3:GetBucketLocation' |
	's3:ListBucket' |
	's3:ListBucketMultipartUploads'

interface BucketPolicyStatement {
	Effect: 'Allow' | 'Deny'
	Principal: {
		AWS: ['*']  // 允许所有用户
	}
	Action: Array<BucketPolicyAction>
	Resource: Array<`arn:aws:s3:::${string}`> // 允许操作的bucket，string为bucket名称
}

const generateUploadPolicyStatement = (bucket: string): BucketPolicyStatement => ({
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:PutObject'],
	Resource: [`arn:aws:s3:::${bucket}/*`]
});
const generateDeletePolicyStatement = (bucket: string): BucketPolicyStatement => ({
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:DeleteObject'],
	Resource: [`arn:aws:s3:::${bucket}/*`]
});
const generateGetPolicyStatement = (bucket: string): Array<BucketPolicyStatement> => ([{
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:GetObject'],
	Resource: [`arn:aws:s3:::${bucket}/*`]
}, {
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:GetBucketLocation'],
	Resource: [`arn:aws:s3:::${bucket}`]
}]);
const generateListPolicyStatement = (bucket: string): Array<BucketPolicyStatement> => ([{
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:ListBucket', 's3:ListBucketMultipartUploads'],
	Resource: [`arn:aws:s3:::${bucket}`]
}, {
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:ListMultipartUploadParts'],
	Resource: [`arn:aws:s3:::${bucket}/*`]
}]);

export default new class MinioOSSService {
	private server: Client | null = null;

	constructor() {
		const minioUrl = getENV('MINIO_URL');
		const minioAccessKey = getENV('MINIO_ACCESS_KEY');
		const minioSecretKey = getENV('MINIO_SECRET_KEY');

		if (!minioUrl || !minioAccessKey || !minioSecretKey) {
			return;
		}
		const url = new URL(minioUrl);

		this.server = new Client({
			endPoint: url.hostname,
			port: parseInt(url.port),
			useSSL: false,
			accessKey: minioAccessKey,
			secretKey: minioSecretKey
		});
	}

	private getMinioFileAddr(bucket: Bucket, filePath: string) {
		const minioUrl = getENV('MINIO_URL');
		const url = new URL(minioUrl);

		return `${url.protocol}//${url.hostname}:${url.port}/${bucket}/${filePath}`;
	}

	private async checkBucketAuth(bucketName: string, auth: BucketAuth) {
		const currentPolicy: { Statement: Array<BucketPolicyStatement> } = JSON.parse(await this.server?.getBucketPolicy(bucketName) || '{ "Statement": [] }');
		const policyActions: Array<BucketPolicyAction> = currentPolicy.Statement.map(item => item.Action).flat();
		const policy: Array<BucketPolicyStatement> = [];

		if (auth.upload && !policyActions.includes('s3:PutObject')) {
			policy.push(generateUploadPolicyStatement(bucketName))
		}
		if (auth.delete && !policyActions.includes('s3:DeleteObject')) {
			policy.push(generateDeletePolicyStatement(bucketName))
		}

		if (auth.get
			&&
			['s3:GetObject', 's3:GetBucketLocation'].some(item => !policyActions.includes(item as BucketPolicyAction))
		) {
			policy.push(...generateGetPolicyStatement(bucketName))
		}

		if (auth.list
			&&
			['s3:ListBucket', 's3:ListBucketMultipartUploads', 's3:ListMultipartUploadParts'].some(item => !policyActions.includes(item as BucketPolicyAction))
		) {
			policy.push(...generateListPolicyStatement(bucketName))
		}

		if (policy.length > 0) {
			await this.server?.setBucketPolicy(bucketName, JSON.stringify({ Statement: policy, Version: '2012-10-17' }));
		}
	}

	async checkBucket(bucketName: string, option?: { auth?: BucketAuth, expiry?: number }) {
		if (!await this.server?.bucketExists(bucketName)) {
			await this.server?.makeBucket(bucketName)
		}
		const { auth, expiry } = option || {};

		if (auth && Object.keys(auth).length > 0) {
			await this.checkBucketAuth(bucketName, auth);
		}
		if (expiry) {
			await this.server?.setBucketLifecycle(bucketName, {
				Rule: [{
					Status: 'Enabled',
					Filter: { Prefix: '' },
					// @ts-ignore
					Expiration: { Days: expiry }
				}]
			});
		}
	}

	async deleteBucket(bucketName: Bucket) {
		await this.server?.removeBucket(bucketName);
	}

	async searchBuckets(bucketName?: string) {
		const result = await this.server?.listBuckets();

		if (!result) {
			return [];
		}

		if (bucketName) {
			return result.filter(item => item.name === bucketName);
		}
		return result;
	}

	async uploadFile(file: { fullPath?: string, stream?: Buffer }, minio: { bucket: Bucket, targetPath: string, fileName: string }) {
		if (!file.fullPath && !file.stream) {
			return;
		}
		const { bucket, targetPath, fileName } = minio;

		if (!bucket || !targetPath || !fileName) {
			return;
		}
		await this.checkBucket(bucket, { auth: { upload: true, delete: true, list: true, get: true } });
		const minioFilePath = path.resolve(targetPath, fileName);

		if (file.fullPath) {
			await this.server?.fPutObject(bucket, minioFilePath, file.fullPath);
		} else if (file.stream) {
			await this.server?.putObject(bucket, minioFilePath, file.stream);
		}
		return this.getMinioFileAddr(bucket, minioFilePath);
	}

	async deleteFile(bucket: Bucket, pathInBucket: string) {
		await this.server?.removeObject(bucket, pathInBucket);
	}

	async getFile(bucket: Bucket, pathInBucket: string): Promise<BucketItemStat | null> {
		return new Promise(resolve => {
			this.server?.statObject(bucket, pathInBucket)
				.then(res => resolve(res))
				.catch(() => resolve(null));
		});
	}

	async searchFilesFromBucket(bucket: Bucket, option?: { prefix?: string, recursive?: boolean }) {
		const result = await this.server?.listObjects(bucket, option?.prefix, option?.recursive);

		return new Promise((resolve, reject) => {
			const files: Array<BucketItem> = [];

			result?.on('data', chunk => {
				// @ts-ignore
				files.push(chunk);
			}).on('end', () => resolve(files))
				.on('error', err => reject(err));
		})
	}

	async downloadFile(bucket: Bucket, pathInBucket: string, target: { toFile?: string, toStream?: boolean }) {
		if (target.toStream) {
			return await this.server?.getObject(bucket, pathInBucket);
		}
		if (target.toFile) {
			return await this.server?.fGetObject(bucket, pathInBucket, target.toFile);
		}
		// const stream = await this.server?.getObject(bucket, pathInBucket);

		// if (stream) {
		// 	const fileStream = fs.createWriteStream(toFile);

		// 	stream.on('data', chunk => {
		// 		fileStream.write(chunk)
		// 		console.log(chunk.toString());
		// 	})
		// 		.on('end', () => console.log(`文件已写入${toFile}`));
		// }
	}
}

import path from 'path';
import fs from 'fs';
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
const generateGetPolicyStatement = (bucket: string): Array<BucketPolicyStatement> => [{
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:GetObject'],
	Resource: [`arn:aws:s3:::${bucket}/*`]
}, {
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:GetBucketLocation'],
	Resource: [`arn:aws:s3:::${bucket}`]
}];
const generateListPolicyStatement = (bucket: string): Array<BucketPolicyStatement> => [{
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:ListBucket', 's3:ListBucketMultipartUploads'],
	Resource: [`arn:aws:s3:::${bucket}`]
}, {
	Effect: 'Allow',
	Principal: { AWS: ['*'] },
	Action: ['s3:ListMultipartUploadParts'],
	Resource: [`arn:aws:s3:::${bucket}/*`]
}];

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

	private getOssFileAddr(bucket: Bucket, filePath: string) {
		const minioUrl = getENV('MINIO_URL');
		const url = new URL(minioUrl);

		return `${url.protocol}//${url.hostname}:${url.port}/${bucket}/${filePath}`;
	}

	/**
	 * 如果存在则不做任何操作，否则创建
	 * @param bucketName
	 */
	private async createBucket(bucketName: string) {
		if (!await this.server?.bucketExists(bucketName)) {
			await this.server?.makeBucket(bucketName)
		}
	}

	private async checkBucketAuth(bucketName: string, auth: BucketAuth) {
		if (Object.keys(auth).length === 0) {
			return;
		}
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

	/**
	 * 为bucket设置保留时长
	 * @param bucketName
	 * @param expiry 保留时长，单位天
	 * @returns
	 */
	private async setBucketExpiry(bucketName: string, expiry: number) {
		if (expiry <= 0) {
			return;
		}
		await this.server?.setBucketLifecycle(bucketName, {
			Rule: [{
				ID: '',
				Status: 'Enabled',
				Prefix: '',
				Expiration: { Days: expiry }
			}]
		});
	}

	async checkBucket(bucketName: string, option?: { auth?: BucketAuth, expiry?: number }) {
		await this.createBucket(bucketName);
		const { auth, expiry } = option || {};

		if (auth) {
			await this.checkBucketAuth(bucketName, auth);
		}

		if (expiry) {
			await this.setBucketExpiry(bucketName, expiry);
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
			return result.filter(item => item.name.includes(bucketName));
		}
		return result;
	}

	async uploadFile(file: { fullPath?: string, readStream?: fs.ReadStream }, oss: { bucket: Bucket, targetPath: string, fileName: string }) {
		if (!file.fullPath && !file.readStream) {
			return;
		}
		const { bucket, targetPath, fileName } = oss;

		if (!bucket || !targetPath || !fileName) {
			return;
		}
		await this.checkBucket(bucket, { auth: { upload: true, delete: true, list: true, get: true } });
		const minioFilePath = path.resolve(targetPath, fileName);

		if (file.fullPath) {
			await this.server?.fPutObject(bucket, minioFilePath, file.fullPath);
		} else if (file.readStream) {
			await this.server?.putObject(bucket, minioFilePath, file.readStream);
		}
		return this.getOssFileAddr(bucket, minioFilePath);
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

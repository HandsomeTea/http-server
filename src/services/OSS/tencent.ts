import { getENV, log } from '@/configs';
import TencentCOS from 'cos-nodejs-sdk-v5';

export default new class TencentOSSService {
	constructor() {
		//
	}

	private get server() {
		return new TencentCOS({
			SecretId: getENV('TENCENT_OSS_SECRET_ID'),
			SecretKey: getENV('TENCENT_OSS_SECRET_KEY')
		});
	}

	async downloadFile(tencentOssFileAddr: string) {
		if (!tencentOssFileAddr) {
			return;
		}
		const [, bucket, region] = tencentOssFileAddr.match(/https:\/\/(.*?)\.cos\.(.*?)\.myqcloud/) || [];

		if (!(bucket && region)) {
			log('downloadFile').error(`Failed to resolve oss address:${tencentOssFileAddr}`);
			return;
		}
		try {
			const file = await this.server.getObject({
				Bucket: bucket,
				Region: region,
				Key: new URL(tencentOssFileAddr).pathname
			});

			if (file.statusCode === 200) {
				return file.Body;
			}
			return;
		} catch (e) {
			log('downloadFile').error(e);
			return;
		}
	}

	async deleteFile(tencentOssFileAddr: string | Array<string>) {
		const bucket = 'demo-product-image-1313090634';
		const region = 'ap-beijing';
		let result: TencentCOS.DeleteObjectResult | null = null;

		if (tencentOssFileAddr && typeof tencentOssFileAddr === 'string') {
			result = await this.server.deleteObject({
				Bucket: bucket,
				Region: region,
				Key: new URL(tencentOssFileAddr).pathname
			});
		}

		if (Array.isArray(tencentOssFileAddr) && tencentOssFileAddr.length > 0) {
			result = await this.server.deleteMultipleObject({
				Bucket: bucket,
				Region: region,
				Objects: tencentOssFileAddr.map(a => ({
					Key: new URL(a).pathname
				}))
			});
		}

		if (!result?.statusCode || result.statusCode && result.statusCode > 300) {
			throw new Exception(`delete ${tencentOssFileAddr} failed!`);
		}
	}

	async uploadAiResourceFile(file: { image?: Buffer, video?: Buffer, audio?: Buffer }, resourceId: string) {
		if (!file.image && !file.video && !file.audio) {
			throw new Exception('there is no file to upload for OSS!');
		}
		const bucket = 'demo-product-image-1313090634';
		const region = 'ap-beijing';

		if (file.image) {
			const saveImgPath = `resource_${resourceId}/image/${new Date().getTime()}.png`;
			const result = await this.server.putObject({
				Bucket: bucket,
				Region: region,
				Key: saveImgPath,
				Body: file.image
			});

			return `https://${result.Location}`;
		}

		if (file.video) {
			const saveVideoPath = `resource_${resourceId}/video/${new Date().getTime()}.mp4`;
			const result = await this.server.putObject({
				Bucket: bucket,
				Region: region,
				Key: saveVideoPath,
				Body: file.video
			});

			return `https://${result.Location}`;
		}

		if (file.audio) {
			const saveVideoPath = `resource_${resourceId}/audio/${new Date().getTime()}.mp3`;
			const result = await this.server.putObject({
				Bucket: bucket,
				Region: region,
				Key: saveVideoPath,
				Body: file.audio
			});

			return `https://${result.Location}`;
		}
		return null;
	}
};

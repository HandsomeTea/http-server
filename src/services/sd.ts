import { log } from '@/configs';
import { HTTP } from './HTTP';

export const SD = new class StableDiffusionService {
	constructor() {
		//
	}

	async imageToImageBySD(host: string, option: {
		initImg: string
		maskImg: string
		// controlImg: string
		count: number
		sence: string
		style: string
		color?: string
		light?: string
		layout?: string
		material?: string
		model: string
		weight: number,
		negativePrompt: string,
		size: '1:1' | '4:3'
	}) {
		const { count, initImg, maskImg, sence, style, color, light, layout, material, model, negativePrompt, weight, size/*, controlImg*/ } = option;
		const result = await HTTP.send(`${host}/sdapi/v1/img2img`, 'POST', undefined, {
			data: {
				'prompt': `best quality, more detail,ultra high res,(photorealistic:1.4),${sence},${style},${color ? `${color},` : ''}${light ? `${light},` : ''}${layout ? `${layout},` : ''}${material ? `${material},` : ''}`,
				'override_settings': {
					'sd_model_checkpoint': 'Chilloutmix-Ni',
					'sd_vae': 'vae-ft-mse-840000-ema-pruned.ckpt'
				},
				'negative_prompt': negativePrompt,
				'seed': -1,
				'subseed_strength': 0,
				'clip_skip': 1,
				'batch_size': count,
				'n_iter': 1,
				'steps': 20,
				'cfg_scale': 7.0,
				...size === '1:1' ? {
					'width': 1280,
					'height': 1280
				} : {
					'width': 1400,
					'height': 1050
				},
				'restore_faces': false,
				'tiling': false,
				'script_args': [],
				'sampler_index': 'DPM++ SDE Karras',
				'init_images': [initImg],
				'mask': maskImg,
				'resize_mode': 0,
				'denoising_strength': 0.85,
				'mask_blur': 1,
				'inpainting_fill': 1,
				'inpaint_full_res': false,
				'inpaint_full_res_padding': 2,
				'inpainting_mask_invert': 0,
				'eta': 0,
				's_churn': 0,
				's_tmax': 0,
				's_tmin': 0,
				's_noise': 1,
				'alwayson_scripts': {
					'ControlNet': {
						'args': [
							{
								'enabled': true,
								'module': model.includes('depth') ? 'depth' : model.includes('canny') ? 'canny' : 'none',
								'model': model,
								weight,
								'image': '',
								'mask': null,
								'invert_image': false,
								'resize_mode': 1,
								'rgbbgr_mode': true,
								'processor_res': 1024,
								'pixel_perfect': true,
								'lowvram': true,
								'threshold_a': 64,
								'threshold_b': 64,
								'guidance_start': 0,
								'guidance_end': 1,
								'control_mode': 0
							}
						]
					}
				}
			}
		}, { timeout: 10 * 60 * 1000 }) as unknown as { images: [string], parameters: Record<string, unknown>, info: string };

		result.images.splice(count);

		return result;
	}

	async getSdStatus(host: string) {
		try {
			const res = await HTTP.send(`${host}/queue/status`, 'GET', undefined, {}, { timeout: 3 * 1000 });

			return {
				normal: true,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				queueSize: res.queue_size || 0
			};
		} catch (e) {
			log('get-sd-status').error(e);
			return {
				normal: false,
				queueSize: 0
			};
		}
	}

	async getSdProgress(host: string) {
		try {
			const result = await HTTP.send(`${host}/sdapi/v1/progress`, 'GET', undefined, {}, { timeout: 2 * 1000 });

			return {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				progress: result.progress as number
			};
		} catch (e) {
			log('get-sd-progress').error(e);
			return {
				progress: 0
			};
		}
	}
};

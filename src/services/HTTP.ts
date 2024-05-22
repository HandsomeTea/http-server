import axios, { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse, AxiosError, Method as AxiosMethod, ResponseType, AxiosInstance } from 'axios';
import httpContext from 'express-http-context';
import Agent from 'agentkeepalive';

import { traceId, log } from '@/configs';
// import JWT from './JWT';

const systemService: Set<string> = new Set([

]);

export abstract class BaseRequest {
	abstract server: AxiosInstance;
	constructor() {
		//
	}

	beforeSendToServer(config: InternalAxiosRequestConfig) {
		if (config.baseURL && systemService.has(config.baseURL)) {
			// if (!config.headers.Authorization) {
			// 	config.headers.Authorization = `Bearer ${JWT.sign()}`;
			// }

			if (!config.headers['x-b3-spanid']) {
				config.headers['x-b3-spanid'] = traceId();
			}

			if (!config.headers['x-b3-traceid']) {
				config.headers['x-b3-traceid'] = httpContext.get('traceId') || traceId();
			}

			if (!config.headers['x-b3-parentspanid']) {
				config.headers['x-b3-parentspanid'] = httpContext.get('spanId');
			}

			if (!config.headers['x-tenantId']) {
				config.headers['x-tenantId'] = httpContext.get('tenantId') || '';
			}
		}

		const zh = config.url?.match(/[\u4e00-\u9fa5]/g);

		if (zh) {
			const _obj: Record<string, string> = {};

			for (let i = 0; i < zh.length; i++) {
				if (!_obj[zh[i]]) {
					_obj[zh[i]] = encodeURIComponent(zh[i]);
				}
			}

			for (const key in _obj) {
				config.url = config.url?.replace(new RegExp(key, 'g'), _obj[key]);
			}
		}

		const { url, baseURL, method, params, data, headers } = config;
		const address = new URL(`${baseURL ? baseURL + url : url}`);

		log(`request-to:[(${method}) ${address.origin + address.pathname}]`).info(JSON.stringify({
			headers,
			query: Object.keys(params || {}).length > 0 ? params : (() => {
				const obj: Record<string, string> = {};

				[...address.searchParams.entries()].map(a => obj[a[0]] = a[1]);
				return obj;
			})(),
			body: data || {}
		}, null, '   '));

		return config;
	}

	beforeSendToServerButError(error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
		log('request-to-other-server').error(error);
		throw new Exception(error);
	}

	async receiveSuccessResponse(response: AxiosResponse) {
		// 这里只处理 response.status >= 200 && response.status <= 207 的情况
		const { data, config: { method, baseURL, url }/*, headers, request, status, statusText*/ } = response;
		const address = new URL(`${baseURL ? baseURL + url : url}`);

		log(`response-from:[(${method}) ${address.origin + address.pathname}]`).info(JSON.stringify(data, null, '   '));
		return Promise.resolve(data);
	}

	receiveResponseNotSuccess(error: AxiosError) {
		const { response, config, request } = error;

		let target = null;

		if (config) {
			const { url, baseURL, method } = config;

			target = `(${method}): ${baseURL ? baseURL + url : url}`;
		} else if (request) {
			target = request.responseURL;
		} else {
			log('response-from-other-server-error').error(error);
			throw new Exception(error);
		}
		const address = new URL(config ? `${config.baseURL ? config.baseURL + config.url : config.url}` : `${target}`);
		const _target = config ? `(${config.method}) ${address.origin + address.pathname}` : address.origin + address.pathname;

		if (response) {
			const { status, statusText, data } = response;
			const redirectCode = new Set([301, 302, 303, 307, 308]);

			if (!redirectCode.has(status)) {
				log(`response-from:[${_target}]`).error({
					status,
					statusText,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					...typeof data === 'string' ? { msg: data } : data
				});
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				throw new Exception(data);
			} else {
				return response;
			}
		}

		log(`response-from:[${_target}]`).error(error);
		throw new Exception(`request to ${target} error : no response.`);
	}

	async send(url: string, method: AxiosMethod, baseURL?: string, options?: httpArgument, params?: { timeout?: number, responseType?: ResponseType }) {
		return await this.server.request(<AxiosRequestConfig>{
			url,
			method,
			baseURL,
			headers: options?.headers,
			params: options?.params,
			data: options?.data,
			...params
		});
	}
}

class VendorRequest extends BaseRequest {
	server = axios.create({
		timeout: 10000,
		httpAgent: new Agent({
			keepAlive: true,
			maxSockets: 100,
			maxFreeSockets: 10,
			timeout: 60000, // active socket keepalive for 60 seconds
			freeSocketTimeout: 30000 // free socket keepalive for 30 seconds
		})
	});

	constructor() {
		super();
		// 请求拦截器
		this.server.interceptors.request.use(this.beforeSendToServer, this.beforeSendToServerButError);

		// 响应拦截器
		this.server.interceptors.response.use(this.receiveSuccessResponse, this.receiveResponseNotSuccess);
	}

	async sendBaidu(method: AxiosMethod, url: string, options?: httpArgument) {
		return await this.send(url, method, 'www.baidu.com', options);
	}
}

// import zlib from 'zlib';
// import xmldom from 'xmldom';
// import { base64, randomString } from '@/utils';
// const time = new Date().toISOString();

// const xmlGenerate = (InResponseTo: string) => {
//     const id1 = randomString();
//     const id2 = randomString();
//     const assertion = `<saml:Assertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion" ID="ID_${id1}" IssueInstant="${time}" Version="2.0">` +
//         '<saml:Issuer>http://bizsso.bizconf.cn:8080/realms/ssodev5</saml:Issuer>' +
//         '<saml:Subject>' +
//         '<saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">bin_liu</saml:NameID>' +
//         '<saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">' +
//         `<saml:SubjectConfirmationData InResponseTo="${InResponseTo}" NotOnOrAfter="${new Date(new Date(time).getTime() + 1 * 60 * 60 * 1000).toISOString()}" Recipient="https://alphamain11684.bizvideo.cn/saml/SSO"/>` +
//         '</saml:SubjectConfirmation>' +
//         '</saml:Subject>' +
//         `<saml:Conditions NotBefore="${time}" NotOnOrAfter="${new Date(new Date(time).getTime() + 60 * 60 * 1000).toISOString()}">` +
//         '<saml:AudienceRestriction>' +
//         '<saml:Audience>https://alphamain11684.bizvideo.cn</saml:Audience>' +
//         '</saml:AudienceRestriction>' +
//         '</saml:Conditions>' +
//         `<saml:AuthnStatement AuthnInstant="${time}" SessionIndex="c59d3c7f-a3b0-40ae-993f-2982ccd15b60::6bd08cb9-f096-4e80-9c23-59a97e7297a2" SessionNotOnOrAfter="${new Date(new Date(time).getTime() + 10 * 60 * 60 * 1000).toISOString()}">` +
//         '<saml:AuthnContext>' +
//         '<saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified</saml:AuthnContextClassRef>' +
//         '</saml:AuthnContext>' +
//         '</saml:AuthnStatement>' +
//         '<saml:AttributeStatement>' +
//         '<saml:Attribute FriendlyName="mail" Name="mail" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">' +
//         '<saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">bin_liu@bizconf.cn</saml:AttributeValue>' +
//         '</saml:Attribute>' +
//         '</saml:AttributeStatement>' +
//         '</saml:Assertion>';

//     return `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Destination="https://alphamain11684.bizvideo.cn/saml/SSO" ID="ID_${id2}" InResponseTo="${InResponseTo}" IssueInstant="${time}" Version="2.0">` +
//         '<saml:Issuer>http://bizsso.bizconf.cn:8080/realms/ssodev5</saml:Issuer>' +
//         '<samlp:Status>' +
//         '<samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>' +
//         '</samlp:Status>' + assertion + '</samlp:Response>';
// };
// const privateKey = `-----BEGIN PRIVATE KEY-----
// MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCteSotaiXRnPX/
// P8GjiibBDTq4JOUosgI4vaAEBmwxRqu5vx6mGh8MmKmzvb0PqOyVSOVfBXytrNl6
// ypJt6b1C3+RledIrt00xE4d9uJpLwRKB3H7XJK8OwJXKH+ki/8u8g2BIFnoIivQy
// Lci7r9ih/LcnWAH2aL2aTQiDndBXfx7vRiNjpIg48w0wXW4m+bOBNDCtokvN5qcA
// W+6ebVMtqEUX5tzgShxMYgT2xSoJ/z07Ar2Nuh6CkMcpwBDIeMyBxS93mubSvhCb
// xstumGd2ljBY7zJ+ovjr1KM4YBUKCXVM4mxZvqzPBFEpKTCgaIfbTsoAZG4gIzNx
// FxkDgd9FAgMBAAECggEAU98PG2IE4vGmpkBnGPDEh/Yje8Cq4yAdnt1frlKEoNZw
// VKAo61oZxPdSpUqJTDb6G7tg2q5Gd5nolEu4vFeUX+7r+HwLt4MqWR3+FjTYtOOm
// VQ8MbGyaDuHiChWfnIJcOMq0FGZ5ngPAyToFoWkFrlwHGYidektt0FqKUUhN4N8T
// caHRh6DGdQsIk2bzsYKFGrnfEf/OZ7E+XmuJ03G36WUfAI8qzDKd6iy6ODSH+HgS
// 6Dv+dv+DurRkPtBXURcXQtZ3jbpXNgYXkDiz4krfA7X5IIpn3Fs4fHSKPO5wtXTy
// ubsC9/WBlkNiYbk2/AcV2BKa0oCXNMeYf4BIk24aSQKBgQDZJZppivJpkJ8s3NrO
// 81U8ktyuLIgqwxcgFbmthirxzt1Jkv75anX0Uhun9Et3JxLRJg8KTxRpuaAx+0PO
// tGlpCJ7aZkIq277/BGusHCtCjQMYwG74Yv/hu4nDV4EyyOxVn42w7aayt4X+UizN
// puJp0G+KlKOYjxtdPnQLGqUKPwKBgQDMgxigD9er6saWxNmknHHyrejn9wUm6W4O
// 4JmfpY2rE51tpk3ez83m4nOzd3DsWrTfxk0NJJVtu+YatMY/QVVFf+wgQpEBxFAG
// wzEkPgc0mQACniTc/wcWza9HN3V34icXk37eNCpBg7MPVigvzoJenm2pegrLV98O
// 8BLSi59NewKBgGYwthxZUX+wmdhJD4g5J7HcA5LMTkChky58SueIrokhqy5GyUuj
// eGNEiNNfumwWrVpUKNvXH2op+2PKNbz/VmQhtHBfk2AMDjSBZhKXJxyos/5gAVlP
// bdBTq5+MfLbjq6UX81yCWuLcT2jCT2dw1Dir6PI0xVC0eFJHY+Ed5vGNAoGBALNM
// SB2kZhA6QCtUn/96jUgXAnfEEMdBphTzApx9t4uCIeZNBD5Q75L5fDiegeklySfb
// Ihhgt4VCVAWb8abpb4oEEg9ibOEgrIyROpcsroKFlQW2glkiWaO7Zm1IiPs20dEQ
// pgzHrThM74KFpavsIE42Fayc67PE8TGWdtoSQPLbAoGATqjm/NgeNewceugJlMS5
// a8GtDdp45XOh1a3OEG4dpUKs+9oi+aqGiApPeAkxQQHwELb60mdho0YwKDlx/JrP
// iiinwBftXpONfpgwAFKVFsRyvFFDIqLK5pFdrsoY/B40U9iF9sWfmallWpF3OhKH
// ZF3LXbFy5K0bEvqa0f7PLUY=
// -----END PRIVATE KEY-----`;

// const certificate = `-----BEGIN CERTIFICATE-----
// MIICoDCCAYgCCQDolThT5I3MTTANBgkqhkiG9w0BAQsFADASMRAwDgYDVQQDDAdz
// dXJwYXNzMB4XDTIyMDgyOTA4MDExM1oXDTIzMDgyOTA4MDExM1owEjEQMA4GA1UE
// AwwHc3VycGFzczCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAK15Ki1q
// JdGc9f8/waOKJsENOrgk5SiyAji9oAQGbDFGq7m/HqYaHwyYqbO9vQ+o7JVI5V8F
// fK2s2XrKkm3pvULf5GV50iu3TTETh324mkvBEoHcftckrw7Alcof6SL/y7yDYEgW
// egiK9DItyLuv2KH8tydYAfZovZpNCIOd0Fd/Hu9GI2OkiDjzDTBdbib5s4E0MK2i
// S83mpwBb7p5tUy2oRRfm3OBKHExiBPbFKgn/PTsCvY26HoKQxynAEMh4zIHFL3ea
// 5tK+EJvGy26YZ3aWMFjvMn6i+OvUozhgFQoJdUzibFm+rM8EUSkpMKBoh9tOygBk
// biAjM3EXGQOB30UCAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAIF91WHVNrbR2hkL+
// UrcJbD1xm+/vjT/iWEMhDkdnrNATp1TFhuen/QZqs524F3Pt3AUhkqYZS/9xrQjy
// 3FqkzA0p0IUXSTlWlTXcbBnIyNXVOUqESxeJRuO/lClHk0js8ng5f64jgxp2T0tw
// CJQM3tvYhZFvy/ZF5Zn2PCaAdAGO4X5SR3MO5j01bFE/JhS9AMA1FluAr1OnoMBd
// iRs9+2kAVbgJdbfKowezgmFL0xf6Spj55bVsqt292NHBQrR61+05dcyAI46pE4Rb
// tbpfsDcucAGDxxTz+qOce3qXume+W/KQZTtA6C2SXd0Y/2v3p4yJf4SLCTt+GMnX
// ZxKctA==
// -----END CERTIFICATE-----`;

export const HTTP = new class _HTTP extends VendorRequest {
	constructor() {
		super();
		// this.init();
	}

	// private async init() {
	//     const entrypointUrl = new URL('https://alphamain11684.bizvideo.cn/saml/login?from=desktop&zm-cid=dFugGYcxp9/95YnXnDfhpnIdVaX8fqJ2p31FWDxqSWc=');
	//     const xmlReqResult = await this.send(entrypointUrl.pathname + entrypointUrl.search, 'GET', entrypointUrl.origin);
	//     const SAMLRequestParam = new URL(xmlReqResult.request.res.responseUrl).searchParams.get('SAMLRequest') as string;
	//     const samlReqXml = zlib.inflateRawSync(Buffer.from(decodeURIComponent(SAMLRequestParam), 'base64')).toString('utf8');
	//     const samlReqXmlDoc = new xmldom.DOMParser().parseFromString(samlReqXml, 'text/xml');

	//     const authnRequest = samlReqXmlDoc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'AuthnRequest')[0];
	//     // const issuer = authnRequest.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Issuer')[0].textContent;
	//     const samlResponseUrl = authnRequest.getAttribute('AssertionConsumerServiceURL') as string;
	//     const businessTraceId = authnRequest.getAttribute('ID') as string;
	//     const samlResponse = xmlGenerate(businessTraceId);
	//     const signdSamlResponse = (await this.send('http://10.184.102.110:8080/api/surpassmgr/plfadaptor/1.0/confresource/document/sign', 'post', undefined, {
	//         data: {
	//             context: samlResponse,
	//             privateKey: privateKey.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\n/g, ''),
	//             certificate
	//         }
	//     })).data.data;
	//     const SAMLResponse = base64(signdSamlResponse);
	//     const data1 = await axios.request({
	//         url: samlResponseUrl,
	//         maxRedirects: 0,
	//         method: 'post',
	//         headers: {
	//             'x-zm-trackingId': `WEB_${randomString()}`,
	//             'content-type': 'application/x-www-form-urlencoded',
	//             cookie: `_zm_mtk_guid=${randomString()};_zm_sf=desktop;_zm_rf_sp=true`
	//         },
	//         data: {
	//             SAMLResponse
	//         },
	//         transformRequest: [function (data) {
	//             let ret = '';

	//             for (const it in data) {
	//                 ret += `${encodeURIComponent(it)}=${encodeURIComponent(data[it])}`;
	//             }
	//             return ret;
	//         }]
	//     });
	//     const setCookie = data1.headers['set-cookie'];
	//     const ssid = setCookie?.find(a => a.includes('_zm_ssid='))?.split(';')[0];
	//     const clusterData = setCookie?.find(a => a.includes('zm_cluster='))?.split(';')[0];
	//     const aid = setCookie?.find(a => a.includes('zm_aid='))?.split(';')[0];
	//     const haid = setCookie?.find(a => a.includes('zm_haid='))?.split(';')[0];

	//     const resultRedirectUrl = new URL(data1.headers.location);
	//     const reqCookieData = (data1.config.headers?.cookie as string).split(';');

	//     const resultDoc = await this.send(resultRedirectUrl.pathname + resultRedirectUrl.search, 'GET', resultRedirectUrl.origin, {
	//         headers: {
	//             cookie: `${reqCookieData[0]};${reqCookieData[2]};${ssid};${clusterData};${aid};${haid}`
	//         }
	//     });
	//     const docu = new xmldom.DOMParser().parseFromString(resultDoc.data as unknown as string, 'text/html');
	//     const launchUrl = docu.getElementById('sso-button')?.getAttribute('href') as string;
	//     const loginToken = new URL(launchUrl).searchParams.get('token');

	//     if (launchUrl) {
	//         console.log(loginToken);
	//     }
	// }

	async search() {
		return await this.sendBaidu('post', '/search', { params: { s: 'test' } });
	}
};

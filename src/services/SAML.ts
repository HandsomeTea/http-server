import xmlbuilder from 'xmlbuilder';
import zlib from 'zlib';
import xmldom from 'xmldom';
import querystring from 'querystring';
import crypto from 'crypto';
import xmlenc from 'xml-encryption';
import xmlCrypto from 'xml-crypto';
import { Request, Response } from 'express';


// import { _SamlSettingsDal } from '@/dal';
// import vendorTempService from './vendorTempService';
import { ErrorCode, log, getENV } from '@/configs';
import { randomString } from '@/utils';

const vendorAuthPopup = (res: Response, option: {
    type: 'SAML' | 'Oauth',
    credentialToken: string,
    credentialSecret?: string,
    schema?: string
    browserStore?: boolean
}, err?: Error) => {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    if (err) {
        const content = `<html><body><h2>Sorry, an annoying error occured</h2><div>${err}</div><a onclick="window.close();">Close Window</a></body></html>`;

        return res.end(content, 'utf-8');
    }
    const { type, credentialToken, credentialSecret, schema } = option;
    const browserStore = Boolean(option.browserStore);
    const schemaParams = [];

    if (credentialToken) {
        schemaParams.push(`token=${credentialToken}`);
    }
    if (credentialSecret) {
        schemaParams.push(`secret=${credentialSecret}`);
    }
    const schemaAddr = schema ? `${schema}://localhost/loginby${type.toLowerCase()}?${schemaParams.join('&')}` : '';
    const jsSetStorage = `window.localStorage.setItem('${type === 'SAML' ? 'samlLoginToken' : 'oauthLoginToken'}', document.getElementById('token').innerText.trim());`;

    const jsHtml = (browserStore ? jsSetStorage : '')
        + 'document.getElementById("loginCompleted").onclick = () => { window.open("about:blank", "_self"); window.close(); };'
        + (schemaAddr ? `window.location.href = '${schemaAddr}';` : '');
    const tokenHtml = `<div id="token" style="display: none;">${type === 'SAML' ? credentialToken : JSON.stringify({ credentialToken, credentialSecret })}</div>` +
        '<p>    Login completed. <a href="#" id="loginCompleted">Click here</a> to close this window.</p>';

    const temp = `<html><head><title>${type} Verified</title></head><body> ${tokenHtml}</body><script type="text/javascript">${jsHtml}</script></html>`;

    return res.end(temp, 'utf-8');
};

const saml = new class SAML {
    constructor() {
        //
    }

    generateServiceProviderMetadata(callbackUrl: string, params: { samlType: string, privateKey?: string, privateCert?: string, customCert?: string, issuer: string }) {
        const xmlNamespace = 'md';
        const NameIDFormatEle = [
            'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
            'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
            'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
            'urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName'
        ];
        const SingleLogoutServiceEle = [{
            '@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            '@Location': `${getENV('ROOT_URL')}/_saml/logout/${params.samlType}/`,
            '@ResponseLocation': `${getENV('ROOT_URL')}/_saml/logout/${params.samlType}/`
        }, {
            '@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            '@Location': `${getENV('ROOT_URL')}/_saml/logout/${params.samlType}/`,
            '@ResponseLocation': `${getENV('ROOT_URL')}/_saml/logout/${params.samlType}/`
        }];
        const AssertionConsumerServiceEle = [{
            '@index': '0',
            '@isDefault': 'true',
            '@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            '@Location': callbackUrl
        }, {
            '@index': '1',
            '@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            '@Location': callbackUrl
        }];
        const metadata = {
            [`${xmlNamespace}:EntityDescriptor`]: {
                '@entityID': params.issuer,
                [`@xmlns:${xmlNamespace}`]: 'urn:oasis:names:tc:SAML:2.0:metadata',
                [`${xmlNamespace}:SPSSODescriptor`]: {
                    '@AuthnRequestsSigned': Boolean(params.privateCert), //向idp发送请求的时候是否要签名
                    '@WantAssertionsSigned': Boolean(params.customCert), //idp返回的数据是否签名
                    '@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
                    [`${xmlNamespace}:SingleLogoutService`]: SingleLogoutServiceEle,
                    [`${xmlNamespace}:NameIDFormat`]: NameIDFormatEle,
                    [`${xmlNamespace}:AssertionConsumerService`]: AssertionConsumerServiceEle
                }
            }
        };

        if (params.privateKey) {
            if (!params.privateCert) {
                throw new Exception('Missing decryptionCert while generating metadata for decrypting service provider', ErrorCode.INVALID_ARGUMENTS);
            }

            let surpassPrivateCert = params.privateCert.replace(/-+BEGIN CERTIFICATE-+\r?\n?/, '');

            surpassPrivateCert = surpassPrivateCert.replace(/-+END CERTIFICATE-+\r?\n?/, '');
            surpassPrivateCert = surpassPrivateCert.replace(/\r\n/g, '\n');

            const KeyDescriptorSigningEle = [{
                '@use': 'signing',
                'ds:KeyInfo': {
                    '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
                    'ds:X509Data': {
                        'ds:X509Certificate': {
                            '#text': surpassPrivateCert
                        }
                    }
                }
            }];
            const KeyDescriptorEncryptionEle = [{
                '@use': 'encryption',
                'ds:KeyInfo': {
                    '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
                    'ds:X509Data': {
                        'ds:X509Certificate': {
                            '#text': surpassPrivateCert
                        }
                    }
                },
                [`${xmlNamespace}:EncryptionMethod`]: [{
                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes256-cbc'
                }, {
                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes128-cbc'
                }, {
                    '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#tripledes-cbc'
                }]
            }];

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            metadata[`${xmlNamespace}:EntityDescriptor`][`${xmlNamespace}:SPSSODescriptor`][`${xmlNamespace}:KeyDescriptor`] = [
                ...params.privateCert ? KeyDescriptorSigningEle : [],
                ...params.privateCert ? KeyDescriptorEncryptionEle : []
            ];
        }

        return xmlbuilder.create(metadata, {
            version: '1.0',
            encoding: 'UTF-8'
        }).end({
            pretty: true,
            indent: '\t',
            newline: '\n'
        });
    }

    validateLogoutRequest(samlRequest: string) {
        const compressedSAMLRequest = Buffer.from(samlRequest, 'base64');
        let decoded: Buffer | null = null;

        try {
            decoded = zlib.inflateRawSync(compressedSAMLRequest);
        } catch (e) {
            throw new Exception(e as Error);
        }

        const doc = new xmldom.DOMParser().parseFromString(Buffer.from(decoded).toString('utf8'), 'text/xml');

        if (!doc) {
            throw new Exception('logout xml document is not found.');
        }
        const request = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutRequest')[0];

        if (!request) {
            throw new Exception('logout xml request is not found.');
        }

        const sessionNode = request.getElementsByTagName('samlp:SessionIndex')[0];
        const nameIdNode = request.getElementsByTagName('saml:NameID')[0];

        return {
            idpSession: sessionNode?.childNodes[0].nodeValue,
            nameID: nameIdNode?.childNodes[0].nodeValue
        };
    }

    generateLogoutResponse(idpSLORedirectURL: string, issuer: string) {
        const id = `_id-${randomString()}`;
        const instant = new Date().toISOString();
        const response = `<samlp:LogoutResponse xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="${id}" Version="2.0" IssueInstant="${instant}" Destination="${idpSLORedirectURL}">`
            + `<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${issuer}</saml:Issuer>`
            + '<samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>'
            + '</samlp:LogoutResponse>';

        return {
            response,
            id
        };
    }

    private signRequest(xml: string, privateKey: string) {
        try {
            return crypto.createSign('RSA-SHA1').update(xml).sign(privateKey, 'base64');
        } catch (e) {
            throw new Exception('sign for saml request failed.');
        }
    }

    // logoutResponseToUrl(response: string, idpSLORedirectURL: string, privateCert?: string, privateKey?: string) {
    //     let buffer: null | Buffer = null;

    //     try {
    //         buffer = zlib.deflateRawSync(response);
    //     } catch (e) {
    //         throw new Exception(e);
    //     }

    //     const base64 = buffer.toString('base64');
    //     let target = idpSLORedirectURL;

    //     if (target.indexOf('?') > 0) {
    //         target += '&';
    //     } else {
    //         target += '?';
    //     }

    //     // TBD. We should really include a proper relayState here
    //     const relayState = `${getENV('ROOT_URL')}`;

    //     const samlResponse: Record<string, string> = {
    //         SAMLResponse: base64,
    //         RelayState: relayState
    //     };

    //     if (privateCert) {
    //         samlResponse.SigAlg = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
    //         samlResponse.Signature = this.signRequest(querystring.stringify(samlResponse), privateKey || '');
    //     }

    //     target += querystring.stringify(samlResponse);

    //     return target;
    // }

    // eslint-disable-next-line no-undef
    private checkXmlDocumentStatus(xmlDoc: Document) {
        const statusNodes = xmlDoc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusCode');

        if (statusNodes.length === 0) {
            throw new Exception('status nodes not found in xml document.');
        }
        const statusCode = statusNodes[0].getAttribute('Value');

        if (statusCode !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
            let message: undefined | string = undefined;
            const statusMessageNode = xmlDoc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage')[0];

            if (statusMessageNode?.firstChild?.textContent) {
                message = statusMessageNode.firstChild.textContent;
            }

            throw new Exception(`get status code from xml document is ${statusCode}, not success: ${message}`);
        }
    }

    // validateLogoutResponse(samlResponse: string) {
    //     const compressedSAMLResponse = Buffer.from(samlResponse, 'base64');
    //     let decoded: null | Buffer = null;

    //     try {
    //         decoded = zlib.inflateRawSync(compressedSAMLResponse);
    //     } catch (e) {
    //         throw new Exception(e);
    //     }
    //     const doc = new xmldom.DOMParser().parseFromString(Buffer.from(decoded).toString('utf8'), 'text/xml');

    //     if (!doc) {
    //         throw new Exception('logout xml document not found.');
    //     }

    //     const response = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutResponse')[0];

    //     if (!response) {
    //         throw new Exception('logout xml response not found.');
    //     }

    //     const inResponseTo = response.getAttribute('InResponseTo');

    //     if (!inResponseTo) {
    //         const msg = doc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'StatusMessage');

    //         log('saml-validateLogoutResponse').error(`Unexpected msg from IDP. Does your session still exist at IDP? Idp returned: \n ${msg}`);
    //     }

    //     this.checkXmlDocumentStatus(doc);

    //     return inResponseTo;
    // }

    private generateAuthorizeRequest(req: Request, params: { tranceId: string, callbackUrl: string, entryPoint: string, issuer: string/*, authnContextComparison: string, customAuthnContext: string*/ }) {
        const request = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="${params.tranceId}" Version="2.0" IssueInstant="${new Date().toISOString()}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" AssertionConsumerServiceURL="${params.callbackUrl || `https://${req.headers.host}/saml/consume`}" Destination="${params.entryPoint}">`
            + `<saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${params.issuer}</saml:Issuer>`
            + '<samlp:NameIDPolicy xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified" AllowCreate="true"></samlp:NameIDPolicy>'
            // <samlp:RequestedAuthnContext xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" Comparison="${authnContextComparison || 'exact'}">
            //     <saml:AuthnContextClassRef xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${customAuthnContext || 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport'}</saml:AuthnContextClassRef>
            // </samlp:RequestedAuthnContext>
            + '</samlp:AuthnRequest>';

        return request;
    }

    private requestToUrl(request: string, operation: string, params: { entryPoint: string, tranceId: string, idpSLORedirectURL: string, samlType: string, privateKey?: string, privateCert?: string }) {
        let deflateResult: null | Buffer = null;
        const { entryPoint, idpSLORedirectURL, samlType, privateKey, privateCert, tranceId } = params;

        try {
            deflateResult = zlib.deflateRawSync(request);
        } catch (e) {
            throw new Exception(e as Error);
        }

        const base64 = deflateResult.toString('base64');
        let target = entryPoint;

        if (operation === 'logout' && idpSLORedirectURL) {
            target = idpSLORedirectURL;
        }

        if (target.indexOf('?') > 0) {
            target += '&';
        } else {
            target += '?';
        }

        const samlRequest: { SAMLRequest: string, RelayState: string, SigAlg?: string, Signature?: string } = {
            SAMLRequest: base64,
            RelayState: operation === 'logout' ? `${getENV('ROOT_URL')}` : tranceId || samlType
        };

        // 用超视云的公钥签名，没有加密
        if (privateCert) {
            samlRequest.SigAlg = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
            samlRequest.Signature = this.signRequest(querystring.stringify(samlRequest), privateKey || '');

            log('samlRequest-Signature').debug(samlRequest.Signature);
        }

        target += querystring.stringify(samlRequest);

        return target;
    }

    getAuthorizeUrl(req: Request, params: { tranceId: string, callbackUrl: string, entryPoint: string, issuer: string, authnContextComparison: string, customAuthnContext: string, idpSLORedirectURL: string, samlType: string, privateKey?: string, privateCert?: string }) {
        const request = this.generateAuthorizeRequest(req, params);

        log('saml-request-url').debug(request);
        return this.requestToUrl(request, 'authorize', {
            entryPoint: params.entryPoint,
            idpSLORedirectURL: params.idpSLORedirectURL,
            samlType: params.samlType,
            privateKey: params.privateKey,
            privateCert: params.privateCert,
            tranceId: params.tranceId
        });
    }

    private certToPEM(cert: string) {
        const _cert = cert.match(/.{1,64}/g)?.join('\n');

        if (_cert) {
            cert = _cert;
        }
        cert = `-----BEGIN CERTIFICATE-----\n${cert}`;
        cert = `${cert}\n-----END CERTIFICATE-----\n`;
        return cert;
    }

    private checkXmlSignature(xml: string, cert: string) {
        const doc = new xmldom.DOMParser().parseFromString(xml);
        const signature = xmlCrypto.xpath(doc, '//*[local-name(.)=\'Signature\' and namespace-uri(.)=\'http://www.w3.org/2000/09/xmldsig#\']')[0] as string;
        const sig = new xmlCrypto.SignedXml();
        const self = this;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        sig.keyInfoProvider = {
            getKeyInfo(/* key*/) {
                return '<X509Data></X509Data>';
            },
            getKey(/* keyInfo*/) {
                return Buffer.from(self.certToPEM(cert));
            }
        };

        sig.loadSignature(signature);

        if (!sig.checkSignature(xml)) {
            throw new Exception('check signature failed');
        }
    }

    // eslint-disable-next-line no-undef
    private checkNotBeforeNotOnOrAfterAssertions(element: Element) {
        const now = new Date();

        if (element.hasAttribute('NotBefore')) {
            const notBefore = element.getAttribute('NotBefore');

            if (!notBefore) {
                throw new Exception('can not get attribute NotBefore.');
            }
            const date = new Date(notBefore);

            if (now < date) {
                throw new Exception('NotBefore assertion failed');
            }
        }

        if (element.hasAttribute('NotOnOrAfter')) {
            const notOnOrAfter = element.getAttribute('NotOnOrAfter');

            if (!notOnOrAfter) {
                throw new Exception('can not get attribute notOnOrAfter.');
            }
            const date = new Date(notOnOrAfter);

            if (now >= date) {
                throw new Exception('notOnOrAfter assertion failed');
            }
        }
    }

    // eslint-disable-next-line no-undef
    private mapAttributes(attributeStatement: Element, profile: Record<string, string>) {
        log('saml-mapAttributes').debug(`Attribute Statement found in SAML response: ${attributeStatement}`);
        // 获取到所有包含用户信息的xml标签
        const attributes = attributeStatement.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Attribute');

        log('saml-mapAttributes').debug(`Attributes will be processed: ${attributes.length}`);

        if (attributes) {
            // 对所有标签挨个解析
            for (let i = 0; i < attributes.length; i++) {
                // 用户某个信息的值
                const values = attributes[i].getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AttributeValue');

                let value = null;

                if (values.length === 1) {
                    value = values[0].textContent;
                } else {
                    // 可能是多个值
                    value = [];
                    for (let j = 0; j < values.length; j++) {
                        value.push(values[j].textContent);
                    }
                }

                // 用户的某个信息键
                const key = attributes[i].getAttribute('Name');

                log('saml-mapAttributes').debug(`Name:  ${attributes[i]}`);
                log('saml-mapAttributes').debug(`Adding attribute from SAML response to profile: ${key} = ${value}`);
                if (key && value) {
                    profile[key] = value as string;
                }
            }
        } else {
            log('saml-mapAttributes').debug('No Attributes found in SAML attribute statement.');
        }

        // 试图取默认的值为关键用户数据赋值

        if (!profile.mail && profile['urn:oid:0.9.2342.19200300.100.1.3']) {
            // See http://www.incommonfederation.org/attributesummary.html for definition of attribute OIDs
            profile.mail = profile['urn:oid:0.9.2342.19200300.100.1.3'];
        }

        if (!profile.email && profile['urn:oid:1.2.840.113549.1.9.1']) {
            profile.email = profile['urn:oid:1.2.840.113549.1.9.1'];
        }

        if (!profile.displayName && profile['urn:oid:2.16.840.1.113730.3.1.241']) {
            profile.displayName = profile['urn:oid:2.16.840.1.113730.3.1.241'];
        }

        if (!profile.eppn && profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.6']) {
            profile.eppn = profile['urn:oid:1.3.6.1.4.1.5923.1.1.1.6'];
        }

        if (!profile.email && profile.mail) {
            profile.email = profile.mail;
        }

        if (!profile.cn && profile['urn:oid:2.5.4.3']) {
            profile.cn = profile['urn:oid:2.5.4.3'];
        }

        return profile;
    }

    async validateResponse(samlResponse: string, params: { idpCustomCert?: string, privateKey?: string }): Promise<{ data?: Record<string, string>, isLogoutResponse?: boolean }> {
        const xml = Buffer.from(samlResponse, 'base64').toString('utf8');

        log('receive-saml-response').debug(xml);
        const samlResponseDoc = new xmldom.DOMParser().parseFromString(xml, 'text/xml');

        if (!samlResponseDoc) {
            log('deal-with-saml-response').error('get response xml dom error.');
            throw new Exception('saml response xml not found.');
        }

        this.checkXmlDocumentStatus(samlResponseDoc);

        // 如果idp有证书，验证idp签名
        if (params.idpCustomCert) {
            this.checkXmlSignature(xml, params.idpCustomCert);
        }

        const response = samlResponseDoc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'Response')[0];

        if (!response) {
            const logoutResponse = samlResponseDoc.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:protocol', 'LogoutResponse');

            if (!logoutResponse) {
                throw new Exception('Unknown SAML response message');
            }
            return { isLogoutResponse: true };
        }

        /** 解密的明文用户数据是xml document对象 */
        // eslint-disable-next-line no-undef
        let assertion: Document | Element = response.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Assertion')[0];
        const encAssertion = response.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'EncryptedAssertion')[0];

        const options = { key: params.privateKey || '' };

        // 如果是加密的数据，用超视云私钥解密
        if (encAssertion) {
            xmlenc.decrypt(encAssertion.getElementsByTagNameNS('*', 'EncryptedData')[0].textContent as string, options, (err, result) => {
                if (err) {
                    throw new Exception(err);
                }
                if (result) {
                    assertion = new xmldom.DOMParser().parseFromString(result, 'text/xml');
                }
            });
        }

        if (!assertion) {
            throw new Exception('Missing SAML assertion');
        }

        let profile: Record<string, string> = {};

        const inResponseToId = response.getAttribute('InResponseTo');

        if (inResponseToId) {
            profile.inResponseToId = inResponseToId;
        }

        const issuer = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Issuer')[0];

        if (issuer?.textContent) {
            profile.issuer = issuer.textContent;
        }

        // eslint-disable-next-line no-undef
        let subject: Document | Element = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Subject')[0];
        const encSubject = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'EncryptedID')[0];

        // 如果是加密的数据，用超视云私钥解密
        if (encSubject) {
            xmlenc.decrypt(encSubject.getElementsByTagNameNS('*', 'EncryptedData')[0].textContent as string, options, (err, result) => {
                if (err) {
                    log('decrypt-xml-encryptedData').error(err);
                    throw new Exception(err);
                }
                if (result) {
                    subject = new xmldom.DOMParser().parseFromString(result, 'text/xml');
                }
            });
        }

        if (subject) {
            const nameID = subject.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'NameID')[0];

            if (nameID?.textContent) {
                profile.nameID = nameID.textContent;
                const nameIDFormat = nameID.getAttribute('Format');

                if (nameIDFormat) {
                    profile.nameIDFormat = nameIDFormat;
                }
            }

            const subjectConfirmation = subject.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'SubjectConfirmation')[0];

            if (subjectConfirmation) {
                const subjectConfirmationData = subjectConfirmation.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'SubjectConfirmationData')[0];

                if (subjectConfirmationData) {
                    this.checkNotBeforeNotOnOrAfterAssertions(subjectConfirmationData);
                }
            }
        }

        const conditions = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'Conditions')[0];

        if (conditions) {
            this.checkNotBeforeNotOnOrAfterAssertions(conditions);
        }

        const authnStatement = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AuthnStatement')[0];

        if (authnStatement) {
            const sessionIndex = authnStatement.getAttribute('SessionIndex');

            if (sessionIndex) {
                profile.sessionIndex = sessionIndex;
            }
        } else {
            log('saml-validateResponse').debug('No AuthN Statement found');
        }

        // 获取xml中的用户信息
        const attributeStatement = assertion.getElementsByTagNameNS('urn:oasis:names:tc:SAML:2.0:assertion', 'AttributeStatement')[0];

        if (attributeStatement) {
            profile = this.mapAttributes(attributeStatement, profile);
        } else {
            log('saml-validateResponse').debug('No Attribute Statement found in SAML response.');
        }

        if (!profile.email && profile.nameID && profile.nameIDFormat && profile.nameIDFormat.indexOf('emailAddress') >= 0) {
            profile.email = profile.nameID;
        }

        const profileKeys = Object.keys(profile);

        for (let i = 0; i < profileKeys.length; i++) {
            const key = profileKeys[i];

            if (key.match(/\./)) {
                profile[key.replace(/\./g, '-')] = profile[key];
                delete profile[key];
            }
        }

        return { data: profile };
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    normalizeCert(customCert: any): any { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (typeof customCert === 'string') {
            return customCert.replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').trim();
        }
        return customCert;
    }
};

export { saml as SAMLTool };

/**目前saml登录似乎只用到了 authorize validate 属性函数， logout 还没用到 */
export const SAML = class SamlService {
    public request: Request;
    public response: Response;
    public tenantId: string;
    private actionName: string;
    /** 如：microsoft */
    public samlType: string;
    private credentialToken: string | undefined;
    /** 如：/_saml/validate/microsoft/11684 */
    private callbackUrl: string;
    /** 如：https://certauth.fs.bizconf.cn/adfs/ls */
    private entryPoint: string;
    /** 如：https://ops-dev.bizconf.cn/zoompub/_saml/authorize/microsoft/11684 */
    private idpSLORedirectURL: string;
    /** 如：https://ops-dev.bizconf.cn/zoompub */
    private issuer: string;
    /** 如：urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport */
    private customAuthnContext: string;
    /** 如：minimum */
    private authnContextComparison: string;
    /** 超视云私钥 */
    private surpassKey?: string;
    /** 超视云公钥/证书 */
    private surpassCert?: string;
    /** idp公钥/证书 */
    private idpCert?: string;
    constructor(params: { actionName: string, samlType: string, credentialToken?: string }, tenantId: string, request: Request, response: Response) {
        this.request = request;
        this.response = response;
        this.tenantId = tenantId;
        this.actionName = params.actionName;
        this.samlType = params.samlType;
        this.credentialToken = params.credentialToken;
        this.callbackUrl = `${getENV('ROOT_URL')}/_saml/validate/${params.samlType}/${tenantId}`;

        // those config from db
        this.entryPoint = '';
        this.idpSLORedirectURL = '';
        this.issuer = '';
        this.customAuthnContext = '';
        this.authnContextComparison = '';
        this.surpassKey = '';
        this.surpassCert = '';
        // People often overlook the instruction to remove the header and footer of the certificate on this specific setting, so let's do it for them.
        this.idpCert = '';
    }

    private async init(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // const service = await new _SamlSettingsDal(this.tenantId).findById(this.samlType) as SamlSettingModel;

        // if (!service) {
        //     throw new Exception('no match saml config.', ErrorCode.INVALID_ARGUMENTS);
        // }

        // this.entryPoint = service.entryPoint;
        // this.idpSLORedirectURL = service.idpSLORedirectURL;
        // this.issuer = service.issuer;
        // this.customAuthnContext = service.customAuthnContext;
        // this.authnContextComparison = service.authnContextComparison;
        // this.surpassKey = service.privateKey;
        // this.surpassCert = service.publicCert;
        // // People often overlook the instruction to remove the header and footer of the certificate on this specific setting, so let's do it for them.
        // this.idpCert = saml.normalizeCert(service.customCert);
    }

    metadata(): void {
        const res = this.response as Response;

        res.success(saml.generateServiceProviderMetadata(this.callbackUrl, {
            samlType: this.samlType,
            privateKey: this.surpassKey,
            privateCert: this.surpassCert,
            customCert: this.idpCert,
            issuer: this.issuer
        }));
    }

    // private async logout(): Promise<void> {
    //     if (this.request.query.SAMLRequest) {
    //         const { nameID, idpSession } = await saml.validateLogoutRequest(this.request.query.SAMLRequest as string);

    //         if (nameID && idpSession) {
    //             const Users = new _Users(this.tenantId);
    //             const logOutUser = async (samlInfo: { nameID: string | null, idpSession: string | null }) => {
    //                 const loggedOutUser = await Users.find({
    //                     $or: [
    //                         { 'services.saml.nameID': samlInfo.nameID },
    //                         { 'services.saml.idpSession': samlInfo.idpSession }
    //                     ]
    //                 });

    //                 if (loggedOutUser.length === 1) {
    //                     await Users.samlLogoutRemoveTokens(loggedOutUser[0]._id);
    //                 }
    //             };

    //             await logOutUser({ nameID, idpSession });
    //         }

    //         // const { response } = saml.generateLogoutResponse({
    //         //     nameID: result.nameID,
    //         //     sessionIndex: result.idpSession
    //         // });
    //         const { response } = saml.generateLogoutResponse(this.idpSLORedirectURL, this.issuer);
    //         const url = saml.logoutResponseToUrl(response, this.idpSLORedirectURL, this.publicCert, this.privateKey);

    //         this.response.writeHead(302, {
    //             Location: url
    //         });
    //         this.response.end();
    //     } else {
    //         const result = saml.validateLogoutResponse(this.request.query.SAMLResponse as string);

    //         if (result) {
    //             const Users = new _Users(this.tenantId);
    //             const logOutUser = async (inResponseTo: string) => {
    //                 const loggedOutUser = await Users.find({
    //                     'services.saml.inResponseTo': inResponseTo
    //                 });

    //                 if (loggedOutUser.length === 1) {
    //                     await Users.samlLogoutRemoveTokens(loggedOutUser[0]._id);
    //                 } else {
    //                     throw new Exception('Found multiple users matching SAML inResponseTo fields');
    //                 }
    //             };

    //             await logOutUser(result);
    //         }

    //         this.response.writeHead(302, {
    //             Location: this.request.query.RelayState as string
    //         });
    //         this.response.end();
    //     }
    // }

    // sloRedirect(): void {
    //     this.response.writeHead(302, {
    //         // credentialToken here is the SAML LogOut Request that we'll send back to IDP
    //         Location: this.request.query.redirect as string
    //     });
    //     this.response.end();
    // }

    authorize(): void {
        const url = saml.getAuthorizeUrl(this.request, {
            callbackUrl: this.callbackUrl,
            entryPoint: this.entryPoint,
            issuer: this.issuer,
            authnContextComparison: this.authnContextComparison,
            customAuthnContext: this.customAuthnContext,
            idpSLORedirectURL: this.idpSLORedirectURL,
            samlType: this.samlType,
            privateKey: this.surpassKey,
            privateCert: this.surpassCert,
            tranceId: this.credentialToken as string
        });

        log('saml-authorize').debug(url);
        this.response.writeHead(301, {
            Location: url
        });
        this.response.end();
    }

    async validate(): Promise<void> {
        const { data } = await saml.validateResponse(this.request.body.SAMLResponse, { idpCustomCert: this.idpCert, privateKey: this.surpassKey });

        if (!data) {
            return;
        }
        log('saml-user-info').info(JSON.stringify(data, null, '   '));
        const credentialToken = data.inResponseToId || data.InResponseTo || this.credentialToken || this.request.body.RelayState;

        if (!credentialToken) {
            const samlIdpCredentialToken = randomString();

            // await vendorTempService.storeSamlCredential(samlIdpCredentialToken, this.tenantId, this.samlType, data);

            const url = `${getENV('ROOT_URL')}/home?saml_idp_credentialToken=${samlIdpCredentialToken}`;

            this.response.writeHead(301, {
                Location: url
            });
            this.response.end();
        } else {
            // await vendorTempService.storeSamlCredential(credentialToken, this.tenantId, this.samlType, data);
            const commandInfo = credentialToken.split('-');
            const idMark = commandInfo[0];

            // socket后端自动登录的逻辑
            if (idMark === 'ws') {
                // await mqService.sendToWebSocketConnections([commandInfo[1]], {
                //     event: 'trans_autonomic_action',
                //     action: 'sso_login',
                //     signal: 'SUCCESS',
                //     type: 'saml',
                //     token: credentialToken
                // });
            }
            vendorAuthPopup(this.response, {
                type: 'SAML',
                credentialToken,
                schema: idMark === 's' ? commandInfo[1] : undefined,
                browserStore: idMark !== 's' && idMark !== 'ws'
            });
        }
    }

    async result(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (this[this.actionName]) {
            await this.init();
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return await this[this.actionName]();
        } else {
            log('saml-result').error(`unknown SAML action with ${this.actionName}.`);
            throw new Exception('saml action/api is not found.', ErrorCode.INVALID_ARGUMENTS);
        }
    }
};


// interface SamlSettingModel {
//     _id: 'microsoft'
//     usernameNormalize?: 'None' | 'Lowercase'
//     nameOverwrite?: boolean
//     customAuthnContext: string
//     userDataFieldMap: SamlUserInfoFormation
//     policy: {
//         noDepartmentDeal: 'as-root' | 'refused' | 'create-belong'
//     }
//     authnContextComparison: 'better' | 'exact' | 'maximum' | 'minimum'
//     idpSLORedirectURL: string
//     entryPoint: string
//     issuer: string
//     trustEndpointURL: string
//     customCert?: string
//     privateKey?: string
//     publicCert?: string
//     createdAt?: Date
//     updatedAt?: Date
// }


// const samlConfig = await new _SamlSettingsDal(tenantId).find();

// if (samlConfig.length > 0) {
//     _temp.saml = {};
//     samlConfig.map(i => {
//         if (_temp.saml && i._id) {
//             _temp.saml[i._id] = SAMLTool.getAuthorizeUrl(req, {
//                 callbackUrl: `${serverConfig.sgAddr}/${serverConfig.namespace}/_saml/validate/${i._id}/${tenantId}`,
//                 entryPoint: i.entryPoint,
//                 issuer: i.issuer,
//                 authnContextComparison: i.authnContextComparison,
//                 customAuthnContext: i.customAuthnContext,
//                 idpSLORedirectURL: i.idpSLORedirectURL,
//                 samlType: i._id,
//                 privateKey: i.privateKey,
//                 privateCert: i.publicCert,
//                 tranceId: spanId
//             });
//         }
//     });
// }

/**
 * @api {get} /api/surpasspub/usermanager/2.0/account/saml/:samlType/tenant/:tenantId/token/:credentialToken/authorize saml的redirectUrl
 * @apiName saml-redirectUrl
 * @apiGroup account-v2
 * @apiDescription 无验证
 * @apiVersion 2.0.0
 * @apiParam (params) {string} samlType samlType，例如microsoft
 * @apiParam (params) {string} tenantId tenantId，例如t2
 * @apiParam (params) {string} credentialToken 客户端一次性标识，例如83562f3447c8cbbafd52
 * @apiSuccess {String} html 一个html页面.
 */
//  router.get('/saml/:samlType/tenant/:tenantId/token/:credentialToken/:actionName', asyncHandler(async (req, res) => {
//     return await samlAction(req, res);
// }));

/**
 * @api {post} /api/surpasspub/usermanager/2.0/account/saml/:samlType/tenant/:tenantId/validate 获取saml的用户信息
 * @apiName get-saml-user-info
 * @apiGroup account-v2
 * @apiDescription 无验证
 * @apiVersion 2.0.0
 * @apiParam (params) {string} samlType samlType，例如microsoft
 * @apiParam (params) {string} tenantId tenantId，例如t2
 * @apiSuccess {String} html 一个html页面.
 */
//  router.route('/saml/:samlType/tenant/:tenantId/:actionName').get(asyncHandler(async (req, res) => {
//     return await samlAction(req, res);
// })).post(asyncHandler(async (req, res) => {
//     return await samlAction(req, res);
// }));

// const samlAction = async (req: Request, res: Response): Promise<void> => {
//     const { actionName, samlType, credentialToken, tenantId } = req.params;

//     check(actionName, String, false);
//     try {
//         const samlInstance = new SAML({ actionName, samlType, credentialToken }, tenantId, req, res);

//         await samlInstance.result();
//     } catch (e) {
//         devLogger(`${req.method.toLowerCase()}: ${req.originalUrl}`).error(e);
//         throw new Exception('saml api run error.');
//     }
// };

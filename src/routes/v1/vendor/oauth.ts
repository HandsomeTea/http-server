import { errorType } from '@/configs';
import { OAuth } from '@/services';
import { check } from '@/utils';
import express from 'express';
import asyncHandler from 'express-async-handler';

const router = express.Router();

/**
 * @api {get} /api/v1/oauth/:oauthType/tenant/:tenantId/callback oauth授权回调
 * @apiName oauth-redirectUrl
 * @apiGroup account-v2
 * @apiDescription 无验证
 * @apiVersion 2.0.0
 * @apiParam (params) {string} oauthType oauth类型，例如github
 * @apiParam (params) {string} tenantId tenantId，例如t2
 * @apiParam  (query) {string} code 回调的code
 * @apiParam  (query) {string} state 回调的state
 * @apiSuccess {String} html 一个html页面.
 */
router.get('/:oauthType/tenant/:tenantId/callback', asyncHandler(async (req, res) => {
    const { oauthType, tenantId } = req.params;

    check(tenantId, String, false);
    check(oauthType, String, false);

    const code = req.query.code as undefined | string;
    const state = req.query.state as undefined | string;

    if (!code || !state) {
        throw new Exception('code and state is required.', errorType.INVALID_ARGUMENTS);
    }
    const oauthServer = new OAuth(oauthType, tenantId, { code, state });

    await oauthServer.init();
    // const serviceData = await oauthServer.getOAuthUser();
    // const credentialSecret = randomSecret();
    // const credentialToken = credentialTokenFromQuery(state);

    // Store the login result so it can be retrieved in another browser tab by the result handler
    // await vendorTempService.storeOauthCredential(credentialToken, tenantId, oauthType, {
    //     serviceData,
    //     credentialSecret
    // });

    const html = `<!DOCTYPE html><html><body>  <p id="completedText" style="display:none;">    Login completed. <a href="#" id="loginCompleted">      Click here</a> to close this window.  </p>  <div id="config" style="display:none;">  ${JSON.stringify({
        setCredentialToken: true,
        // credentialToken,
        // credentialSecret,
        storagePrefix: 'Surpass.oauth.credentialSecret-',
        isCordova: false
    })}</div>  <script type="text/javascript">window.localStorage.setItem('oauthLoginToken', document.getElementById('config').innerText.trim());window.close()</script></body></html>`;

    res.end(html, 'utf-8');
}));

export default router;

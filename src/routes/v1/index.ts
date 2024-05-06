import express from 'express';
import user from './users';
// import vendor from './vendor';

const router = express.Router();

/** /api/v1/user */
router.use('/user', user);
// router.use(vendor);

export default router;

// import express from 'express';
// import { accountApi, accountPubApi, accountMgrApi } from './account';
// import { userApi, userAdmApi, userMgrApi } from './user-info';
// import { tenantApi, tenantPubApi, tenantAdmApi, tenantMgrApi } from './tenant';

// const v2Api = express.Router();
// const v2PubApi = express.Router();
// const v2AdmApi = express.Router();
// const v2MgrApi = express.Router();

// /* /api/surpass/usermanager/2.0 */
// v2Api.use('/2.0', accountApi, userApi, tenantApi);

// /* /api/surpasspub/usermanager/2.0 */
// v2PubApi.use('/2.0', accountPubApi, tenantPubApi);

// /* /api/surpassadm/usermanager/2.0 */
// v2AdmApi.use('/2.0', userAdmApi, tenantAdmApi);

// /* /api/surpassmgr/usermanager/2.0 */
// v2MgrApi.use('/2.0', accountMgrApi, userMgrApi, tenantMgrApi);

// export { v2Api, v2PubApi, v2AdmApi, v2MgrApi };

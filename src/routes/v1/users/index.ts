import express from 'express';
import search from './search';
import base from './base';

const router = express.Router();

/** /api/v1/user */
router.use(search, base);

export default router;


// import express from 'express';
// import user from './surpass';
// import userAdm from './surpassadm';
// import userMgr from './surpassmgr';

// const userApi = express.Router();
// const userAdmApi = express.Router();
// const userMgrApi = express.Router();

// /* /api/surpass/usermanager/2.0/user */
// userApi.use('/user', user);

// /* /api/surpassadm/usermanager/2.0/user */
// userAdmApi.use('/user', userAdm);

// /* /api/surpassmgr/usermanager/2.0/user */
// userMgrApi.use('/user', userMgr);

// export { userApi, userAdmApi, userMgrApi };

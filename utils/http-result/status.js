export const httpStatus = new class httpStatus {
    constructor() {
        /***************** 200类错误 *********************/
        /**默认 */
        this.success = 'SUCCESS';
        /**查找类操作成功 */
        this.successSearch = 'SEARCH_SUCCESS';


        /***************** 400类错误 *********************/
        /**默认 */
        this.failed = 'BAD_REQUEST';
        /**更新类操作失败 */
        this.failedUpdate = 'UPDATE_FAILED';


        /***************** 403类错误 ***********************/
        /**默认 */
        this.noPermission = 'FORBIDDEN';
        /**用户无权操作 */
        this.noPermissionUser = 'USER_NO_PERMISSION';


        /***************** 404类错误 ***********************/
        /**默认 */
        this.notFound = 'NOT_FOUND';
        /**相关操作的用户未找到 */
        this.notFoundUser = 'USER_NOT_FOUND';


        /***************** 429类错误 ***********************/
        /**默认 */
        this.tooMany = 'TOO_MANY_REQUESTS';


        /***************** 500类错误 ***********************/
        /**默认 */
        this.innerError = 'INTERNAL_SERVER_ERROR';
        /**数据库连接错误 */
        this.innerDBError = 'DB_CONNECT_ERROR';
    }
};

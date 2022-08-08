import { errorType } from '@/configs';
import { _Users, _AddressBookRules } from '@/dal';
import HTTP from './HTTP';

export default new class AddressbookService {
    constructor() {
        //
    }

    async getAddressbookShowOption(userId: string, tenantId: string, isSearch = false) {
        const Users = new _Users(tenantId);
        const user = await Users.findById(userId);

        if (!user) {
            throw new Exception('user is not found.', errorType.USER_NOT_FOUND);
        }

        /** 用户部门路径，如：/a/b/c => ['a', 'b', 'c'] */
        let userDepartmentPathArr: Array<string> = [];

        if ((user.departmentId || '/') !== '/') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            userDepartmentPathArr = (await HTTP.getDepartmentInfo({ id: user.departmentId }, tenantId)).path.split('/') as Array<string>;
            userDepartmentPathArr.splice(0, 1);
        }

        // ========================================================================计算userId看不见的人和部门 start========================================

        /** userId看不见的用户 */
        const userNotIn: Set<string> = new Set();
        /** userId看不见的部门(不包括其所有子部门) */
        const parentDepartmentNotIn: Set<string> = new Set();
        const AddressBookRules = new _AddressBookRules(tenantId);

        /** 对所有人都隐藏的规则 */
        const hiddenToAll = await AddressBookRules.getHiddenToAllRules();
        /** 将userId(或其所在部门)列为黑名单的规则 */
        const hiddenToUser = await AddressBookRules.getHiddenToUserRules(userId, userDepartmentPathArr);
        /** 有白名单但是userId(或其所在部门)不在白名单中的规则 */
        const notVisibleToUser = await AddressBookRules.getWhiteListWithoutUserRules(userId, userDepartmentPathArr);

        hiddenToAll.concat(hiddenToUser, notVisibleToUser).map(a => {
            if (a.targetUserIds) {
                a.targetUserIds.map(s => userNotIn.add(s));
            }

            if (a.targetDepartmentIds) {
                a.targetDepartmentIds.map(s => parentDepartmentNotIn.add(s));
            }
        });

        /** userId看不见的部门(包括其所有子部门) */
        let departmentNotIn: Set<string> = new Set();

        if (parentDepartmentNotIn.size > 0) {
            // 如果是搜索而非树形层级展开，则需要计算不可见部门的子部门
            if (isSearch) {
                const parentDepartmentNotInArr = [...parentDepartmentNotIn] as Array<string>;

                await (async function loop() {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const childrenDepartmentIds = await HTTP.getBranchDepartments(parentDepartmentNotInArr[0]) as Array<string>;

                    childrenDepartmentIds.map(a => departmentNotIn.add(a));
                    parentDepartmentNotInArr.splice(0, 1);
                    if (parentDepartmentNotInArr.length > 0) {
                        await loop();
                    }
                })();
            } else {
                departmentNotIn = parentDepartmentNotIn;
            }
        }
        // ========================================================================计算userId看不见的人和部门 end========================================


        // ========================================================================检查userId是否只能看见自己所在部门的组织架构 start========================================

        /** userId只能看见的部门(不包括其所有子部门) */
        let parentDepartmentIn = '';

        /** 查询是否有将userId(及其所在部门)限制为只能看到自己所在部门的组织架构的规则
         * 该类规则对target如果是跟部门的情况在数据提交时做了处理：将跟部门转化为其第一级子部门下面的人和部门
        */
        const visibleToSelfOrg = await AddressBookRules.checkUserHasScanSelfOrgRules(user._id, userDepartmentPathArr);

        /** 如果有这样的规则，则userId只能看到自己所在部门的组织架构 */
        if (visibleToSelfOrg.length > 0) {
            parentDepartmentIn = user.departmentId || '/';
        }

        const departmentIn: Set<string> = new Set();

        if (parentDepartmentIn) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const childrenDepartmentIds = await HTTP.getBranchDepartments(parentDepartmentIn) as Array<string>;

            childrenDepartmentIds.map(a => departmentIn.add(a));
        }
        // ========================================================================检查userId是否只能看见自己所在部门的组织架构 end========================================

        // 冲突处理，即departmentIn中的数据在departmentNotIn中有，则在departmentIn中删除
        if (departmentNotIn.size > 0) {
            for (const dep of departmentNotIn) {
                if (departmentIn.has(dep)) {
                    departmentIn.delete(dep);
                }
            }
        }

        return {
            ...userNotIn.size > 0 ? { userNotIn: [...userNotIn] } : {},
            ...departmentNotIn.size > 0 ? { departmentNotIn: [...departmentNotIn] } : {},
            ...departmentIn.size > 0 ? { departmentIn: [...departmentIn] } : {}
        };
    }
};

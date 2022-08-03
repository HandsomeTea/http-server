import { Scheduled } from '@/dal';
import { fixedNumString, getFormatDateObject } from '@/utils';
import { log } from '@/configs';

export default new class ScheduledTaskService {
    constructor() {
        this.init();
    }

    private async init() {
        const self = this;

        setInterval(async () => {
            const tasks = await Scheduled.getShouldExcuteTask();

            log('should-excute-task-list').info(JSON.stringify(tasks));
            if (tasks.length > 0) {
                await (async function loop() {
                    const task = tasks[0];

                    log('scheduled-task').info(`task: ${task.type} will run right now: ${JSON.stringify(task, null, '   ')}`);
                    // if (task.type === 'zwwechat_org_sync') {
                    //     wechatService.syncZwWechatOrganizationStruct(task.tenantId);
                    // }
                    await self.setNextTask(task);

                    tasks.splice(0, 1);
                    if (tasks.length > 0) {
                        await loop();
                    }
                })();
            }
        }, 5 * 60 * 1000);
    }

    private async setNextTask(currentTask: ScheduledTaskModel) {
        const schedule = await Scheduled.findOneScheduled({ _id: currentTask.belongId });

        if (schedule) {
            if (schedule.endTime && schedule.endTime.getTime() < new Date().getTime()) {
                await Scheduled.removeTask({ _id: currentTask._id });
                return;
            }
            const { cycle, cycleUnit } = schedule;
            const timestamp = cycleUnit === 'hour' ? cycle * 60 * 60 * 1000 :
                cycleUnit === 'day' ? cycle * 24 * 60 * 60 * 1000 :
                    cycleUnit === 'week' ? cycle * 7 * 24 * 60 * 60 * 1000 : 0;
            let num = 1;
            const fn = (): Date => {
                if (new Date(currentTask.hitTime.getTime() + num * timestamp).getTime() < new Date().getTime()) {
                    num++;
                    return fn();
                } else {
                    return new Date(currentTask.hitTime.getTime() + num * timestamp);
                }
            };

            await Scheduled.createTask({
                belongId: currentTask.belongId,
                tenantId: currentTask.tenantId,
                hitTime: fn(),
                type: currentTask.type
            } as ScheduledTaskModel);
            await Scheduled.removeTask({ _id: currentTask._id });
        }
    }

    async createFirstTask(scheduleInfo: { _id?: ScheduledType }) {
        const schedule = await Scheduled.findOneScheduled(scheduleInfo);

        if (schedule) {
            const { hitTime, cycle, cycleUnit } = schedule;
            const { minute, year, month, day, hour, week } = getFormatDateObject();
            let taskHitTime: Date | null = null;

            if (cycleUnit === 'hour') {
                taskHitTime = new Date(`${year}/${month}/${day} ${fixedNumString(hour)}:${fixedNumString(Number(hitTime))}:00`);

                // 如果当前小时已经过了要求的分钟数
                if (Number(hitTime) < minute) {
                    taskHitTime = new Date(taskHitTime.getTime() + cycle * 60 * 60 * 1000);
                }
            } else if (cycleUnit === 'day') {
                const [_hour, _minute] = hitTime.split(':');

                taskHitTime = new Date(`${year}/${month}/${day} ${fixedNumString(Number(_hour))}:${fixedNumString(Number(_minute))}:00`);

                // 如果现在已经过了要求的执行时间
                if (new Date().getTime() > taskHitTime.getTime()) {
                    taskHitTime = new Date(taskHitTime.getTime() + cycle * 24 * 60 * 60 * 1000);
                }
            } else if (cycleUnit === 'week') {
                const [_week, time] = hitTime.split('-');
                const [_hour, _minute] = time.split(':');

                taskHitTime = new Date(`${year}/${month}/${day} ${fixedNumString(Number(_hour))}:${fixedNumString(Number(_minute))}:00`);

                // 还没到执行时间
                if (week < Number(_week)) {
                    taskHitTime = new Date(taskHitTime.getTime() + (Number(_week) - week) * 24 * 60 * 60 * 1000);
                }
                if (week > Number(hitTime)) {
                    taskHitTime = new Date(taskHitTime.getTime() + (cycle * 7 + (7 + (Number(_week) - week))) * 24 * 60 * 60 * 1000);
                }
            } else {
                throw new Exception('unknow hitTime!');
            }

            const type: ScheduledTaskType = 'zwwechat_org_sync';

            await Scheduled.createTask({
                belongId: schedule._id,
                tenantId: schedule.tenantId,
                hitTime: taskHitTime as Date,
                type
            } as ScheduledTaskModel);
        }
    }
};

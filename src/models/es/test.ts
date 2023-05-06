
import Base from './base';

interface TestModel {
    a: number
    b: boolean
    c: string
    d: {
        test: number
    }
}

export default new class Test extends Base<TestModel>{
    constructor() {
        super('test1');
    }
};

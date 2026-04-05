import { helper } from '@ember/component/helper';

export function add([a, b]) {
    return Number(a || 0) + Number(b || 0);
}

export default helper(add);

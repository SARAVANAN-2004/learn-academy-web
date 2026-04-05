import Component from '@glimmer/component';

export default class LoadingSkeletonComponent extends Component {
    // @type: 'card' | 'table' | 'text'
    // @count: number of items to show

    get items() {
        return Array.from({ length: this.args.count || 3 });
    }
}

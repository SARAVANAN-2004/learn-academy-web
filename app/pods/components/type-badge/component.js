import Component from '@glimmer/component';

export default class TypeBadgeComponent extends Component {
    get normalizedType() {
        return (this.args.type || '').toLowerCase();
    }
}

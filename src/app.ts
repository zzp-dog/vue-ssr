import { Component, Vue } from 'vue-property-decorator';

@Component({
    name: 'app',
})
export default class AppComponent extends Vue {
    constructor() {
        super();
    }
    beforeMount() {
        console.log('beforeMount...')
    }
    mounted() {
        console.log('mounted...')
    }
}

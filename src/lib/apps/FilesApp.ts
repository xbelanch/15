import { FakeOS } from '../../scenes/FakeOS';
import App from './App';
import PicGrid from '../ui/gameObjects/PicGrid';

/**
 * Gallery app
 */
export default class DocumentsApp extends App {

    protected media: any;
    protected picGrid?: PicGrid;

    public constructor(fakeOS: FakeOS) {
        super(fakeOS);
        this.media = this.fakeOS.cache.json.get('files');
    }

    /**
     * @inheritdoc
     */
    public render(): void {
        this.picGrid = new PicGrid(
            this.fakeOS,
            0, 0,
            this.media
        );
        this.fakeOS.add.existing(this.picGrid);
        this.addElements(this.picGrid);
    }

    /**
     * @inheritdoc
     */
    public goToID(id: string, skipLayerChangeAnim = false): void {
        this.skipLayerChangeAnim = skipLayerChangeAnim;
        this.reRender();
        this.picGrid?.open(id);
    }
}